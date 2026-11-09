"""Rakentaa karttasivun datan keruuajoista → site/data/latest.json

  python collector/build_site.py

Jokaisesta kamerasta: sijainti, viimeisin keli lähimmältä asemalta (jos asema on lähellä ja
siinä on optinen kelianturi) ja historia viimeisistä ajoista. Kuvia ei kopioida sivulle:
sivu näyttää Fintraffiicin tuoreen kuvan suoraan heidän osoitteestaan.
"""
from __future__ import annotations

import gzip
import json
import sys
import tarfile
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from count import km, station_coords  # noqa: E402
from labels import CLASSES, label, station_index  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SITE_DATA = ROOT / "site" / "data"
MAX_KM = 5.0       # kauempana oleva asema ei kerro tämän kameran kelistä
HISTORY_RUNS = 8   # 8 × 3 h = vuorokausi


def r2(x):
    return None if x is None else round(float(x), 2)


def main() -> None:
    tars = sorted({p.name: p for p in OUT.glob("**/*.tar")}.values())
    runs = []
    for p in tars:
        t = tarfile.open(p)
        meta = json.load(t.extractfile("manifest.json"))
        if meta["images"] < 100:  # pikatestit pois
            continue
        stations = station_index(json.loads(gzip.decompress(t.extractfile("weather.json.gz").read())))
        runs.append((meta, stations))
    if not runs:
        raise SystemExit("Ei keruuajoja kansiossa out/")
    runs = runs[-HISTORY_RUNS:]
    coords = station_coords()

    def row(item, stations):
        st = coords.get(item.get("weatherStation"))
        d = km(item["lat"], item["lon"], st[1], st[0]) if st else None
        lab = label(item, stations)
        near = d is not None and d <= MAX_KM
        return lab, d, near

    history: dict[str, list] = {}
    for meta, stations in runs:
        for item in meta["items"]:
            lab, d, near = row(item, stations)
            history.setdefault(item["camera"], []).append({
                "t": item["measuredTime"],
                "c": lab["class"] if near else None,
                "f": r2(lab.get("friction")) if near else None,
            })

    meta, stations = runs[-1]
    cams = []
    counts = {c: 0 for c in CLASSES} | {"ei mittausta": 0}
    for item in meta["items"]:
        lab, d, near = row(item, stations)
        cls = lab["class"] if near else None
        counts[cls or "ei mittausta"] += 1
        cams.append({
            "id": item["camera"],
            "name": (item.get("cameraName") or item["camera"]).replace("_", " "),
            "road": item.get("road"),
            "mun": item.get("municipality"),
            "lat": round(item["lat"], 5),
            "lon": round(item["lon"], 5),
            "img": f"https://weathercam.digitraffic.fi/{item['preset']}.jpg",
            "view": item.get("presetName"),
            "t": item["measuredTime"],
            "cls": cls,
            "why": None if cls else ("asema yli 5 km päässä" if d and d > MAX_KM else lab.get("reason")),
            "st": item.get("weatherStation"),
            "km": round(d, 1) if d is not None else None,
            "friction": r2(lab.get("friction")) if near else None,
            "water": r2(lab.get("water_mm")) if near else None,
            "snow": r2(lab.get("snow_mm")) if near else None,
            "ice": r2(lab.get("ice_mm")) if near else None,
            "roadT": r2(lab.get("road_temp")) if near else None,
            "airT": r2(lab.get("air_temp")) if near else None,
            "hist": history.get(item["camera"], []),
        })

    SITE_DATA.mkdir(parents=True, exist_ok=True)
    (SITE_DATA / "latest.json").write_text(json.dumps({
        "run": meta["startedAt"],
        "built": datetime.now(timezone.utc).isoformat(),
        "maxKm": MAX_KM,
        "classes": CLASSES,
        "counts": counts,
        "cameras": cams,
    }, ensure_ascii=False, separators=(",", ":")))
    print(f"{len(cams)} kameraa, {len(runs)} ajoa historiaan → site/data/latest.json")
    print(counts)


if __name__ == "__main__":
    main()
