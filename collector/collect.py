"""Keräin: hakee puuttuvat keruuhetket Digitrafficin ~23 h historiasta ja tallentaa ne.

  python collector/collect.py              # kaikki puuttuvat hetket, kaikki kamerat
  python collector/collect.py --dry-run    # mitä haettaisiin
  python collector/collect.py --limit 30   # pikatesti
  python collector/collect.py --check-gaps # menetetyt ruudukkohetket; exit 1, jos niitä on

Yksi keruuhetki = <hetki>.tar (format 2) ja sen tunnisteyhteenveto <hetki>.labels.json:
  images/<kulma>.jpg     hetkeä lähin kuva (±10 min), leveys 640 px
  manifest.json          kuvien tiedot ja lähimmän aseman anturit kuvan ottohetkellä (±10 min)
  weather.json.gz        kameroiden asemien kaikki anturit keruuhetkellä
  forecast_*.json.gz     ennusteet ajohetkeltä, vain ajon uusimmassa tiedostossa
"""
from __future__ import annotations

import argparse
import gzip
import io
import json
import os
import sys
import tarfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import forecasts  # noqa: E402
from digitraffic import (IMG_WIDTH, WORKERS, camera_history, camera_meta, fetch_image, pick_preset,  # noqa: E402
                         sensor_names, station_coords, station_series)
from slots import (WINTER_CODES, WINTER_ROAD_T, kind_of, lost_slots, missing_slots, nearest, snapshot,  # noqa: E402
                   stamp_of, winter_rank)
from storage import existing_stamps, path_for, upload  # noqa: E402
from summary import write_summary  # noqa: E402

IMAGE_TOLERANCE = timedelta(minutes=10)   # kuva enintään näin kaukana keruuhetkestä
SENSOR_TOLERANCE = timedelta(minutes=10)  # anturiarvo enintään näin kaukana kuvan ottohetkestä
WINTER_MAX = 250                          # talvihetken kuvakatto (tila 100 Gt); ensin lumi ja jää
IMAGE_WORKERS = 16
ITEM_SENSORS = ["OPTISEN_ANTURIN_KELI1", "KITKA1_LUKU", "VEDEN_MÄÄRÄ1", "LUMEN_MÄÄRÄ1", "JÄÄN_MÄÄRÄ1",
                "TIE_1", "ILMA", "KASTEPISTE", "ILMAN_KOSTEUS", "TIENPINNAN_TILA_1", "SADE_INTENSITEETTI"]


def pick_images(slots: list[datetime], cams: list[dict], history: dict) -> dict[datetime, list[tuple]]:
    """Jokaiselle hetkelle ja kameralle hetkeä lähin kuva: [(kamera, kulma, ottoaika, osoite), …]."""
    picks = {}
    for t in slots:
        picks[t] = []
        for cam in cams:
            p = pick_preset(cam)
            if hit := nearest(history.get(p["id"], []), t, IMAGE_TOLERANCE):
                picks[t].append((cam, p, hit[0], hit[1]))
    return picks


def station_snapshots(picks: dict, now: datetime) -> dict[int, dict[datetime, dict]]:
    """Asemien anturit sekä keruuhetkellä että jokaisen kuvan ottohetkellä: {asema: {hetki: {anturi: …}}}."""
    want: dict[int, set[datetime]] = {}
    for t, chosen in picks.items():
        for cam, _, img_t, _ in chosen:
            if (sid := cam.get("nearestWeatherStationId")) is not None:
                want.setdefault(sid, set()).update((t, img_t))
    names, frm = sensor_names(), min(picks) - IMAGE_TOLERANCE - SENSOR_TOLERANCE

    def one(sid: int) -> dict:
        series = station_series(sid, frm, now, names)
        return {t: snapshot(series, t, SENSOR_TOLERANCE) for t in want[sid]}

    with ThreadPoolExecutor(WORKERS) as ex:
        return dict(zip(want, ex.map(one, want)))


def choose(t: datetime, picks: list[tuple], snaps: dict) -> list[tuple]:
    """Ruudukkohetkeen kaikki kamerat, talvihetkeen vain talviset (lumi ja jää ensin, enintään WINTER_MAX)."""
    if kind_of(t) == "grid":
        return picks
    ranked = [(r, x) for x in picks
              if (r := winter_rank(snaps.get(x[0].get("nearestWeatherStationId"), {}).get(t, {}))) is not None]
    return [x for _, x in sorted(ranked, key=lambda y: y[0])[:WINTER_MAX]]


def fetch_forecasts() -> tuple[dict, list[str]]:
    data, errors = {}, []
    for name, fn in (("road", forecasts.road_forecast), ("fmi", forecasts.fmi_forecast)):
        try:
            data[name] = fn()
        except Exception as e:  # ennusteen puute ei saa estää kuvien keruuta
            errors.append(f"{name}: {e}")
            print(f"  ! ennuste {name}: {e}", file=sys.stderr)
    return data, errors


def write_slot(t: datetime, chosen: list[tuple], snaps: dict, skipped_no_image: int, started: datetime,
               fc: tuple[dict, list[str]] | None) -> Path:
    with ThreadPoolExecutor(IMAGE_WORKERS) as ex:
        images = list(ex.map(lambda c: fetch_image(c[3]), chosen))
    buf, items, failed = io.BytesIO(), [], 0
    with tarfile.open(fileobj=buf, mode="w") as tar:
        def add(name: str, data: bytes) -> None:
            info = tarfile.TarInfo(name)
            info.size, info.mtime = len(data), int(started.timestamp())
            tar.addfile(info, io.BytesIO(data))

        for (cam, p, img_t, _), img in zip(chosen, images):
            if img is None:
                failed += 1
                continue
            sid = cam["nearestWeatherStationId"]
            at_img = snaps.get(sid, {}).get(img_t, {})
            add(f"images/{p['id']}.jpg", img)
            items.append({
                "preset": p["id"], "presetName": p.get("name"), "surfaceView": p.get("directionCode") == "9",
                "camera": cam["id"], "cameraName": cam["name"], "lat": cam["lat"], "lon": cam["lon"],
                "road": cam["road"], "municipality": cam["municipality"], "weatherStation": sid,
                "measuredTime": img_t.isoformat(),
                "sensors": {k: at_img[k] for k in ITEM_SENSORS if k in at_img},
                "bytes": len(img),
            })

        kind = kind_of(t)
        meta = {
            "format": 2, "run": stamp_of(t), "slot": t.isoformat(), "kind": kind,
            "collectedAt": started.isoformat(), "imageWidth": IMG_WIDTH, "images": len(items),
            "skipped": {"failed": failed, "no_image_near_slot": skipped_no_image},
            "rules": {"imageMaxMin": IMAGE_TOLERANCE.seconds // 60, "sensorMaxMin": SENSOR_TOLERANCE.seconds // 60,
                      **({"winter": f"optinen koodi {sorted(WINTER_CODES)} tai tie {WINTER_ROAD_T} °C, "
                                    f"enintään {WINTER_MAX}"} if kind == "winter" else {})},
            "source": "Fintraffic / digitraffic.fi, CC BY 4.0",
            "items": items,
        }
        if fc:
            data, errors = fc
            meta.update(forecastsFetchedAt=started.isoformat(), forecastErrors=errors,
                        forecasts={k: v.get("summary") for k, v in data.items()})
            for name, d in data.items():
                add(f"forecast_{name}.json.gz", gzip.compress(json.dumps(d, separators=(",", ":")).encode()))
        weather = {"dataUpdatedTime": t.isoformat(), "stations": [
            {"id": sid, "sensorValues": [{"name": k, **v} for k, v in by_t.get(t, {}).items()]}
            for sid, by_t in snaps.items()]}
        add("manifest.json", json.dumps(meta, ensure_ascii=False, indent=1).encode())
        add("weather.json.gz", gzip.compress(json.dumps(weather).encode()))

    path = path_for(t)
    path.write_bytes(buf.getvalue())
    print(f"  tiedosto: {path.name} ({path.stat().st_size / 1e6:.1f} Mt, {len(items)} kuvaa)")
    return path


def run(limit: int | None = None, dry_run: bool = False) -> list[Path]:
    started = datetime.now(timezone.utc)
    slots = missing_slots(started, existing_stamps(started))
    grid = sum(kind_of(t) == "grid" for t in slots)
    print(f"Ajo {stamp_of(started)} · puuttuvia keruuhetkiä: {grid} ruudukko, {len(slots) - grid} talvi")
    if not slots:
        return []

    cams = camera_meta(limit)
    picks = pick_images(slots, cams, camera_history())
    snaps = station_snapshots(picks, started)
    jobs = {t: choose(t, picks[t], snaps) for t in slots}
    for t, chosen in jobs.items():
        print(f"  {t:%d.%m. %H:%M} {kind_of(t):<6} {len(chosen):>4} kuvaa")
    if dry_run:
        return []

    # Tyhjäkin talvihetki tallennetaan, ettei sitä tarkisteta joka ajossa uudelleen.
    fc, newest, coords, paths = fetch_forecasts(), max(jobs), station_coords(), []
    for t, chosen in jobs.items():
        path = write_slot(t, chosen, snaps, len(cams) - len(picks[t]), started, fc if t == newest else None)
        paths.append(path)
        try:
            paths.append(write_summary(path, coords))
        except Exception as e:  # päivittäinen valmiusajo täydentää puuttuvan yhteenvedon
            print(f"::warning::tunnisteyhteenveto {path.name}: {e}", file=sys.stderr)
    print(f"  valmis {(datetime.now(timezone.utc) - started).total_seconds():.0f} s")
    return paths


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="vain N ensimmäistä kameraa (testi)")
    ap.add_argument("--dry-run", action="store_true", help="näytä puuttuvat keruuhetket, älä lataa kuvia")
    ap.add_argument("--check-gaps", action="store_true", help="menetetyt ruudukkohetket; exit 1, jos niitä on")
    args = ap.parse_args()

    if args.check_gaps:
        now = datetime.now(timezone.utc)
        lost = lost_slots(now, existing_stamps(now))
        for t in lost:
            print(f"::error::Keruuhetki {t:%Y-%m-%d %H:%M} UTC menetetty: yhtään ajoa ei mennyt läpi ~23 h:n sisällä")
        print(f"Menetettyjä keruuhetkiä: {len(lost)}")
        raise SystemExit(1 if lost else 0)

    written = run(args.limit, args.dry_run)
    upload(written)
    if out := os.environ.get("GITHUB_OUTPUT"):
        with open(out, "a") as f:
            f.write(f"collected={'true' if written else 'false'}\n")


if __name__ == "__main__":
    main()
