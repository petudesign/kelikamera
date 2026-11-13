"""Kelikamera AI – keräin.

Kuvat ja anturit haetaan Digitrafficin ~23 h historiasta kiinteille keruuhetkille, joten ajon
käynnistymisaika ei vaikuta dataan. Jokainen ajo hakee kaikki puuttuvat hetket:
  ruudukko  joka 3. tasatunti UTC, kaikki kamerat
  talvi     muut tasatunnit, vain kamerat, joiden asemalla on lunta/jäätä/kuuraa tai tie nollan tuntumassa

Yksi keruuhetki = yksi tar-tiedosto <hetki>.tar (format 2), jossa:
  images/<presetId>.jpg   hetkeä lähin kuva (±10 min) pienennettynä (leveys IMG_WIDTH)
  manifest.json           kuvien metatiedot, ottoaika ja aseman anturit kuvan ottohetkellä (±10 min)
  weather.json.gz         kameroiden lähimpien asemien kaikki anturit keruuhetkellä
  forecast_*.json.gz      ennusteet ajohetkeltä, vain ajon uusimmassa tiedostossa (ei saatavilla historiasta)

Tiedosto tallentuu kansioon out/YYYY/MM/DD/. Jos ympäristössä on HF_TOKEN ja
HF_REPO, tiedostot ladataan myös Hugging Face -datasettiin (yksityinen), yhtenä committina.

Käyttö:
  python collector/collect.py              # kaikki puuttuvat hetket, kaikki kamerat
  python collector/collect.py --dry-run    # mitä haettaisiin
  python collector/collect.py --limit 30   # pikatesti
"""
from __future__ import annotations

import argparse
import gzip
import io
import json
import os
import sys
import tarfile
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from PIL import Image

API = "https://tie.digitraffic.fi"
HEADERS = {
    # Digitraffic pyytää tunnistamaan sovelluksen tällä otsakkeella.
    "Digitraffic-User": "Kelikamera-AI/0.1",
    "Accept-Encoding": "gzip",
}
IMG_WIDTH = 640
JPEG_QUALITY = 80
# Keruuhetket (DECISIONS.md 2026-11-11): kuvat ja anturit haetaan Digitrafficin ~23 h historiasta.
SLOT_HOURS = 3                         # ruudukkohetki joka 3. tasatunti UTC (00, 03, …, 21)
SLOT_TOLERANCE = timedelta(minutes=10) # kuva enintään näin kaukana keruuhetkestä
SENSOR_TOLERANCE = timedelta(minutes=10)  # anturiarvo enintään näin kaukana kuvan ottohetkestä (asemat 5 min välein)
HISTORY_SPAN = timedelta(hours=22)     # historia ulottuu ~23 h taakse; tunti varmuusvaraa
SETTLE = timedelta(minutes=15)         # hetken jälkeen odotetaan, että myös sen jälkeinen kuva on olemassa
OLD_RUN_COVERS = timedelta(minutes=30) # vanhan muodon ajo kattaa näin lähellä olevan ruudukkohetken
WINTER_CODES = {5, 6, 7, 9}            # talvitihennys: kuura, lumi, jää, sohjo (KELI-koodisto) …
WINTER_ROAD_T = (-2.0, 2.0)            # … tai tienpinta nollan tuntumassa (°C)
WINTER_MAX = 250                       # talvihetken kuvakatto (tila: 100 Gt); ensin lumi/jää/kuura, sitten lämpötila
ITEM_SENSORS = ["OPTISEN_ANTURIN_KELI1", "KITKA1_LUKU", "VEDEN_MÄÄRÄ1", "LUMEN_MÄÄRÄ1", "JÄÄN_MÄÄRÄ1",
                "TIE_1", "ILMA", "KASTEPISTE", "ILMAN_KOSTEUS", "TIENPINNAN_TILA_1", "SADE_INTENSITEETTI"]
META_MAX_AGE = timedelta(days=7)     # kameroiden metatiedot muuttuvat harvoin
META_VERSION = 3                      # nosta, kun metatietoihin lisätään kenttiä
FMI_WFS = "https://opendata.fmi.fi/wfs"
FMI_QUERY = "fmi::forecast::edited::weather::scandinavia::point::multipointcoverage"
FMI_PARAMS = ["Temperature", "DewPoint", "Humidity", "Precipitation1h", "TotalCloudCover", "WindSpeedMS"]
FMI_HOURS = 96
FMI_BATCH = 60                        # asemia per pyyntö (URL:n pituus)
WORKERS = 8
IMAGE_WORKERS = 16                    # kuvat tulevat Fintraffiicin kuvapalvelimelta

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "cache"
OUT = ROOT / "out"

session = requests.Session()
session.headers.update(HEADERS)


def get_json(path: str) -> dict:
    for attempt in range(3):
        try:
            r = session.get(API + path, timeout=30)
            r.raise_for_status()
            return r.json()
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))
    raise RuntimeError("unreachable")


def parse_time(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None


# ---------------------------------------------------------------- metadata --
def camera_meta(limit: int | None) -> list[dict]:
    """Kameroiden tiedot (sijainti, lähin sääasema, kulmat). Välimuisti 7 pv."""
    cache_file = CACHE / "cameras.json"
    if cache_file.exists():
        cached = json.loads(cache_file.read_text())
        age = datetime.now(timezone.utc) - parse_time(cached["fetched"])
        if age < META_MAX_AGE and cached.get("v") == META_VERSION:
            cams = cached["cameras"]
            return cams[:limit] if limit else cams

    ids = [f["id"] for f in get_json("/api/weathercam/v1/stations")["features"]]
    if limit:
        ids = ids[:limit]

    def detail(cid: str) -> dict | None:
        try:
            f = get_json(f"/api/weathercam/v1/stations/{cid}")
        except requests.RequestException as e:
            print(f"  ! {cid}: {e}", file=sys.stderr)
            return None
        p = f["properties"]
        lon, lat = f["geometry"]["coordinates"][:2]
        return {
            "id": cid,
            "name": p.get("name"),
            "names": p.get("names"),  # fi / sv / en, esim. "Tie 51 Inkoo" / "Road 51 Inkoo"
            "lat": lat,
            "lon": lon,
            "municipality": p.get("municipality"),
            "province": p.get("province"),
            "road": (p.get("roadAddress") or {}).get("roadNumber"),
            # tieosoite: järjestys tien varrella (tiekohtainen näkymä)
            "roadSection": (p.get("roadAddress") or {}).get("roadSection"),
            "roadDistance": (p.get("roadAddress") or {}).get("distanceFromRoadSectionStart"),
            "nearestWeatherStationId": p.get("nearestWeatherStationId"),
            "presets": [
                {
                    "id": s["id"],
                    "name": s.get("presentationName"),
                    "directionCode": s.get("directionCode"),
                }
                for s in p.get("presets", [])
                if s.get("inCollection")
            ],
        }

    with ThreadPoolExecutor(WORKERS) as ex:
        cams = [c for c in ex.map(detail, ids) if c and c["presets"]]

    if not limit:  # välimuistiin vain täysi lista
        CACHE.mkdir(exist_ok=True)
        cache_file.write_text(json.dumps(
            {"v": META_VERSION, "fetched": datetime.now(timezone.utc).isoformat(), "cameras": cams},
            ensure_ascii=False))
    return cams


def pick_preset(cam: dict) -> dict:
    """Yksi kulma per kamera: 'Tienpinta' (suunta 9) jos on, muuten ensimmäinen."""
    for p in cam["presets"]:
        if p.get("directionCode") == "9":
            return p
    return cam["presets"][0]


# --------------------------------------------------------------- forecasts --
def weather_stations() -> list[dict]:
    """Tiesääasemien sijainnit (v2). Välimuisti 7 pv."""
    f = CACHE / "weather_stations_v2.json"
    if f.exists():
        cached = json.loads(f.read_text())
        if datetime.now(timezone.utc) - parse_time(cached["fetched"]) < META_MAX_AGE:
            return cached["stations"]
    st = [{"id": x["id"], "lon": round(x["geometry"]["coordinates"][0], 4),
           "lat": round(x["geometry"]["coordinates"][1], 4)}
          for x in get_json("/api/weather/v2/stations")["features"]]
    CACHE.mkdir(exist_ok=True)
    f.write_text(json.dumps({"fetched": datetime.now(timezone.utc).isoformat(), "stations": st}))
    return st


def fetch_road_forecast() -> dict:
    """Digitrafficin tiesääennuste kaikille tieosuuksille (sellaisenaan)."""
    data = get_json("/api/weather/v2/forecast-sections/forecasts")
    data["summary"] = {"sections": len(data.get("forecastSections", []))}
    return data


def fetch_fmi_forecast() -> dict:
    """Ilmatieteen laitoksen muokattu ennuste jokaisen tiesääaseman kohdalle.

    Tiivis muoto: params × times × stations. values[i][j] = asema i, aika j, arvot FMI_PARAMS-järjestyksessä.
    """
    import re
    stations = weather_stations()
    end = (datetime.now(timezone.utc) + timedelta(hours=FMI_HOURS)).strftime("%Y-%m-%dT%H:00:00Z")
    out = {"source": "Ilmatieteen laitos, avoin data, CC BY 4.0", "query": FMI_QUERY,
           "params": FMI_PARAMS, "fetched": datetime.now(timezone.utc).isoformat(),
           "stations": [], "times": None, "values": []}
    for i in range(0, len(stations), FMI_BATCH):
        batch = stations[i:i + FMI_BATCH]
        q = [("service", "WFS"), ("version", "2.0.0"), ("request", "getFeature"),
             ("storedquery_id", FMI_QUERY), ("parameters", ",".join(FMI_PARAMS)),
             ("timestep", "180"), ("endtime", end)] + [("latlon", f"{s['lat']},{s['lon']}") for s in batch]
        r = requests.get(FMI_WFS, params=q, timeout=60)
        r.raise_for_status()
        xml = r.text
        pos = re.search(r"<gmlcov:positions>(.*?)</gmlcov:positions>", xml, re.S)
        val = re.search(r"<gml:doubleOrNilReasonTupleList>(.*?)</gml:doubleOrNilReasonTupleList>", xml, re.S)
        if not (pos and val):
            raise RuntimeError(f"tyhjä vastaus erälle {i}")
        p, v = pos.group(1).split(), val.group(1).split()
        rows = [(float(p[k]), float(p[k + 1]), int(p[k + 2])) for k in range(0, len(p), 3)]
        n = len(FMI_PARAMS)
        series: dict[tuple, list] = {}
        for idx, (la, lo, t) in enumerate(rows):
            vals = [None if x == "NaN" else float(x) for x in v[idx * n:(idx + 1) * n]]
            series.setdefault((round(la, 2), round(lo, 2)), []).append((t, vals))
        for s in batch:
            pts = series.get((round(s["lat"], 2), round(s["lon"], 2)))
            if not pts:
                continue
            pts.sort()
            if out["times"] is None:
                out["times"] = [t for t, _ in pts]
            out["stations"].append(s["id"])
            out["values"].append([vals for _, vals in pts])
        time.sleep(0.5)  # kohteliaisuustauko FMI:lle
    out["summary"] = {"stations": len(out["stations"]), "times": len(out["times"] or [])}
    return out


# ------------------------------------------------------------------ slots --
def slot_times(now: datetime) -> list[tuple[datetime, str]]:
    """Keruuhetket historian kattamalta ajalta: tasatunnit, joista joka kolmas on ruudukkohetki."""
    first = (now - HISTORY_SPAN).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    out, t = [], first
    while t <= now - SETTLE:
        out.append((t, "grid" if t.hour % SLOT_HOURS == 0 else "winter"))
        t += timedelta(hours=1)
    return out


def stamp_of(t: datetime) -> str:
    return t.strftime("%Y%m%dT%H%MZ")


def existing_stamps(now: datetime) -> list[datetime]:
    """Jo tallennetut ajot kolmelta viime päivältä (Hugging Face, tai paikallisesti out/)."""
    days = [now - timedelta(days=d) for d in (2, 1, 0)]
    names: list[str] = []
    token, repo = os.environ.get("HF_TOKEN"), os.environ.get("HF_REPO")
    if token and repo:
        from huggingface_hub import HfApi
        api = HfApi(token=token)
        for day in days:
            try:
                names += [f.path.rsplit("/", 1)[-1] for f in
                          api.list_repo_tree(repo, path_in_repo=day.strftime("data/%Y/%m/%d"), repo_type="dataset")]
            except Exception:  # päivän kansiota ei vielä ole
                pass
    else:
        for day in days:
            names += [f.name for f in (OUT / day.strftime("%Y/%m/%d")).glob("*.tar")]
    return [datetime.strptime(n[:-4], "%Y%m%dT%H%MZ").replace(tzinfo=timezone.utc)
            for n in names if n.endswith(".tar")]


def missing_slots(now: datetime) -> list[tuple[datetime, str]]:
    have = existing_stamps(now)

    def done(t: datetime, kind: str) -> bool:
        if kind == "grid":  # vanhan muodon ajo (esim. 06:21) kattaa lähimmän ruudukkohetken
            return any(abs(h - t) <= OLD_RUN_COVERS for h in have)
        return t in have
    return [(t, k) for t, k in slot_times(now) if not done(t, k)]


# ---------------------------------------------------------------- history --
def camera_history() -> dict[str, list[tuple[datetime, str]]]:
    """{kulma: [(ottoaika, kuvan osoite), …]} kaikista kameroista ~23 h ajalta, yhdellä haulla."""
    d = get_json("/api/weathercam/v1/stations/history")
    return {p["id"]: sorted((parse_time(h["lastModified"]), h["imageUrl"]) for h in p.get("history", [])
                            if h.get("lastModified") and h.get("imageUrl"))
            for s in d.get("stations", []) for p in s.get("presets", [])}


def nearest(series: list[tuple], t: datetime, tol: timedelta):
    """Lähin (aika, arvo) aikaa t, enintään tol päässä. Sarja aikajärjestyksessä."""
    i = _bisect(series, t)
    best = min((series[j] for j in (i - 1, i) if 0 <= j < len(series)),
               key=lambda x: abs(x[0] - t), default=None)
    return best if best and abs(best[0] - t) <= tol else None


def _bisect(series: list[tuple], t: datetime) -> int:
    lo, hi = 0, len(series)
    while lo < hi:
        mid = (lo + hi) // 2
        if series[mid][0] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo


def sensor_names() -> dict[int, str]:
    return {s["id"]: s["name"] for s in get_json("/api/weather/v2/sensors")["sensors"]}


def station_snapshots(sid: int, times: set[datetime], frm: datetime, to: datetime,
                      names: dict[int, str]) -> dict[datetime, dict[str, dict]]:
    """Aseman kaikki anturit kullakin pyydetyllä hetkellä: {hetki: {anturi: {value, measuredTime}}}.
    Raaka 5 min sarja (~20 000 arvoa/asema) käsitellään heti, jotta muisti ei kasva."""
    try:
        d = get_json(f"/api/weather/v2/stations/{sid}/data/history"
                     f"?from={frm:%Y-%m-%dT%H:%M:%SZ}&to={to:%Y-%m-%dT%H:%M:%SZ}")
    except requests.RequestException as e:
        print(f"  ! asema {sid}: {e}", file=sys.stderr)
        return {}
    series: dict[str, list] = {}
    for v in d.get("sensorValues", []):
        if v.get("measuredTime") and v.get("id") in names:
            series.setdefault(names[v["id"]], []).append((parse_time(v["measuredTime"]), v.get("value")))
    for x in series.values():
        x.sort(key=lambda y: y[0])
    out = {}
    for t in times:
        snap = {}
        for name, x in series.items():
            hit = nearest(x, t, SENSOR_TOLERANCE)
            if hit:
                snap[name] = {"value": hit[1], "measuredTime": hit[0].isoformat()}
        out[t] = snap
    return out


def winter_rank(snap: dict[str, dict]) -> int | None:
    """Talvitihennyksen ehto: 0 = optinen anturi näyttää lunta/jäätä/kuuraa, 1 = tie nollan tuntumassa,
    None = ei talvinen. Pienempi = tärkeämpi, kun kuvakatto tulee vastaan."""
    code = (snap.get("OPTISEN_ANTURIN_KELI1") or {}).get("value")
    road = (snap.get("TIE_1") or {}).get("value")
    if code is not None and int(code) in WINTER_CODES:
        return 0
    if road is not None and WINTER_ROAD_T[0] <= road <= WINTER_ROAD_T[1]:
        return 1
    return None


# ------------------------------------------------------------------ images --
def fetch_image(url: str) -> bytes | None:
    for attempt in range(3):  # kuvapalvelin katkaisee joskus siirron kesken
        try:
            r = session.get(url, timeout=30)
            r.raise_for_status()
            im = Image.open(io.BytesIO(r.content)).convert("RGB")
            break
        except Exception as e:  # verkko- tai kuvavirhe: yritetään uudelleen, lopulta ohitetaan
            if attempt == 2:
                print(f"  ! {url.split('?')[0]}: {e}", file=sys.stderr)
                return None
            time.sleep(1 + attempt)
    if im.width > IMG_WIDTH:
        im = im.resize((IMG_WIDTH, round(im.height * IMG_WIDTH / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()


# --------------------------------------------------------------------- run --
def run(limit: int | None, dry_run: bool = False) -> list[Path]:
    """Hakee puuttuvat keruuhetket historiasta. Palauttaa kirjoitetut tar-tiedostot."""
    started = datetime.now(timezone.utc)
    slots = missing_slots(started)
    print(f"Ajo {stamp_of(started)} · puuttuvia keruuhetkiä: "
          f"{sum(k == 'grid' for _, k in slots)} ruudukko, {sum(k == 'winter' for _, k in slots)} talvi")
    if not slots:
        return []

    cams = camera_meta(limit)
    hist = camera_history()

    # 1) kuva per kamera per hetki: lähin enintään SLOT_TOLERANCE päässä
    picks: dict[datetime, list[tuple[dict, dict, datetime, str]]] = {}
    for t, _ in slots:
        picks[t] = []
        for cam in cams:
            p = pick_preset(cam)
            hit = nearest(hist.get(p["id"], []), t, SLOT_TOLERANCE)
            if hit:
                picks[t].append((cam, p, hit[0], hit[1]))

    # 2) anturiarvot: keruuhetkellä (aseman tilannekuva + talviehto) ja kunkin kuvan ottohetkellä
    want: dict[int, set[datetime]] = {}
    for t, _ in slots:
        for cam, _, img_t, _ in picks[t]:
            sid = cam.get("nearestWeatherStationId")
            if sid is not None:
                want.setdefault(sid, set()).update((t, img_t))
    names = sensor_names()
    frm = min(t for t, _ in slots) - SLOT_TOLERANCE - SENSOR_TOLERANCE
    with ThreadPoolExecutor(WORKERS) as ex:
        snaps = dict(zip(want, ex.map(lambda sid: station_snapshots(sid, want[sid], frm, started, names), want)))
    print(f"  kameroita {len(cams)}, asemia {len(snaps)}")

    # 3) talvihetkiin vain kamerat, joiden asemalla on talvinen tilanne
    jobs = []
    for t, kind in slots:
        if kind == "grid":
            chosen = picks[t]
        else:
            ranked = [(r, x) for x in picks[t]
                      if (r := winter_rank(snaps.get(x[0].get("nearestWeatherStationId"), {}).get(t, {}))) is not None]
            chosen = [x for _, x in sorted(ranked, key=lambda y: y[0])[:WINTER_MAX]]
        # tyhjäkin talvihetki tallennetaan (vain manifest + anturit), jotta sitä ei tarkisteta joka ajossa uudelleen
        jobs.append((t, kind, chosen))
        print(f"  {t:%d.%m. %H:%M} {kind:<6} {len(chosen):>4} kuvaa")
    if dry_run:
        return []

    forecasts, forecast_errors = {}, []
    for name, fn in (("road", fetch_road_forecast), ("fmi", fetch_fmi_forecast)):
        try:
            forecasts[name] = fn()
        except Exception as e:  # ennusteen puute ei saa kaataa kuvien keruuta
            forecast_errors.append(f"{name}: {e}")
            print(f"  ! ennuste {name}: {e}", file=sys.stderr)

    paths = []
    newest = max(t for t, _, _ in jobs)
    for t, kind, chosen in jobs:
        with ThreadPoolExecutor(IMAGE_WORKERS) as ex:
            images = list(ex.map(lambda c: fetch_image(c[3]), chosen))
        manifest, failed = [], 0
        tar_buf = io.BytesIO()
        with tarfile.open(fileobj=tar_buf, mode="w") as tar:
            def add(name: str, data: bytes):
                info = tarfile.TarInfo(name)
                info.size = len(data)
                info.mtime = int(started.timestamp())
                tar.addfile(info, io.BytesIO(data))

            for (cam, p, img_t, _), img in zip(chosen, images):
                if img is None:
                    failed += 1
                    continue
                sid = cam["nearestWeatherStationId"]
                at_img = snaps.get(sid, {}).get(img_t, {})
                add(f"images/{p['id']}.jpg", img)
                manifest.append({
                    "preset": p["id"],
                    "presetName": p.get("name"),
                    "surfaceView": p.get("directionCode") == "9",
                    "camera": cam["id"],
                    "cameraName": cam["name"],
                    "lat": cam["lat"],
                    "lon": cam["lon"],
                    "road": cam["road"],
                    "municipality": cam["municipality"],
                    "weatherStation": sid,
                    "measuredTime": img_t.isoformat(),  # kuvan ottoaika
                    # aseman anturit kuvan ottohetkellä (lähin arvo, enintään SENSOR_TOLERANCE)
                    "sensors": {k: at_img[k] for k in ITEM_SENSORS if k in at_img},
                    "bytes": len(img),
                })

            # asemien kaikki anturit keruuhetkellä, sama rakenne kuin Digitrafficin /stations/data
            weather = {"dataUpdatedTime": t.isoformat(), "stations": [
                {"id": sid, "sensorValues": [{"name": k, **v} for k, v in snaps[sid].get(t, {}).items()]}
                for sid in snaps]}
            meta = {
                "format": 2,
                "run": stamp_of(t),
                "slot": t.isoformat(),
                "kind": kind,
                "collectedAt": started.isoformat(),
                "imageWidth": IMG_WIDTH,
                "images": len(manifest),
                "skipped": {"failed": failed, "no_image_near_slot": len(cams) - len(picks[t])},
                "rules": {"imageMaxMin": SLOT_TOLERANCE.seconds // 60,
                          "sensorMaxMin": SENSOR_TOLERANCE.seconds // 60,
                          **({"winter": f"optinen koodi {sorted(WINTER_CODES)} tai tie {WINTER_ROAD_T} °C, enintään {WINTER_MAX}"}
                             if kind == "winter" else {})},
                "source": "Fintraffic / digitraffic.fi, CC BY 4.0",
                "items": manifest,
            }
            if t == newest:  # ennusteita ei saa historiasta: ne tulevat ajohetkeltä uusimpaan tiedostoon
                meta["forecastsFetchedAt"] = started.isoformat()
                meta["forecasts"] = {k: v.get("summary") for k, v in forecasts.items()}
                meta["forecastErrors"] = forecast_errors
                for name, data in forecasts.items():
                    add(f"forecast_{name}.json.gz", gzip.compress(json.dumps(data, separators=(",", ":")).encode()))
            add("manifest.json", json.dumps(meta, ensure_ascii=False, indent=1).encode())
            add("weather.json.gz", gzip.compress(json.dumps(weather).encode()))

        day_dir = OUT / t.strftime("%Y/%m/%d")
        day_dir.mkdir(parents=True, exist_ok=True)
        path = day_dir / f"{stamp_of(t)}.tar"
        path.write_bytes(tar_buf.getvalue())
        paths.append(path)
        print(f"  tiedosto: {path.relative_to(ROOT)} ({path.stat().st_size / 1e6:.1f} Mt, {len(manifest)} kuvaa)")

    print(f"  valmis {(datetime.now(timezone.utc) - started).total_seconds():.0f} s")
    return paths


def set_output(key: str, value: str) -> None:
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"{key}={value}\n")


def upload(paths: list[Path]) -> None:
    token, repo = os.environ.get("HF_TOKEN"), os.environ.get("HF_REPO")
    if not paths:
        return
    if not (token and repo):
        if os.environ.get("GITHUB_ACTIONS"):
            # Pilvessä puuttuva asetus on virhe: muuten data katoaisi hiljaa.
            raise SystemExit("HF_TOKEN-salaisuus tai HF_REPO-muuttuja puuttuu repon asetuksista")
        print("  (HF_TOKEN/HF_REPO puuttuu – ei ladata Hugging Faceen)")
        return
    from huggingface_hub import CommitOperationAdd, HfApi

    api = HfApi(token=token)
    api.create_repo(repo, repo_type="dataset", private=True, exist_ok=True)
    ops = [CommitOperationAdd(path_in_repo="data/" + str(p.relative_to(OUT)), path_or_fileobj=str(p)) for p in paths]
    api.create_commit(repo_id=repo, repo_type="dataset", operations=ops,
                      commit_message="Keruu " + ", ".join(p.stem for p in paths))
    print(f"  ladattu: {repo} ({len(paths)} tiedostoa)")


def check_gaps(now: datetime) -> list[datetime]:
    """Ruudukkohetket, jotka ovat juuri pudonneet historian ulkopuolelle (22–30 h sitten) ilman tiedostoa."""
    have = existing_stamps(now)
    lost = []
    t = (now - HISTORY_SPAN).replace(minute=0, second=0, microsecond=0)
    while t >= now - HISTORY_SPAN - timedelta(hours=8):
        if t.hour % SLOT_HOURS == 0 and t < now - HISTORY_SPAN and not any(abs(h - t) <= OLD_RUN_COVERS for h in have):
            lost.append(t)
        t -= timedelta(hours=1)
    return sorted(lost)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="vain N ensimmäistä kameraa (testi)")
    ap.add_argument("--dry-run", action="store_true", help="näytä puuttuvat keruuhetket ja kuvamäärät, älä lataa kuvia")
    ap.add_argument("--check-gaps", action="store_true",
                    help="tarkista, onko ruudukkohetkiä menetetty (historia ei enää kata niitä); virhe = exit 1")
    args = ap.parse_args()
    if args.check_gaps:
        lost = check_gaps(datetime.now(timezone.utc))
        for t in lost:
            print(f"::error::Keruuhetki {t:%Y-%m-%d %H:%M} UTC menetetty: yhtään keruuajoa ei mennyt läpi ~23 h:n sisällä")
        print(f"Menetettyjä keruuhetkiä: {len(lost)}")
        raise SystemExit(1 if lost else 0)
    written = run(args.limit, args.dry_run)
    upload(written)
    set_output("collected", "true" if written else "false")
