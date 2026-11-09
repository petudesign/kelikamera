"""Luokkalaskuri: montako käyttökelpoista esimerkkiä kustakin kelistä on kertynyt.

  python collector/count.py          # paikalliset ajot (out/)
  python collector/count.py --hf     # lataa ensin Hugging Facesta (vaatii: hf auth login)

Kertoo per luokka: kuvat, eri kamerat (tärkeämpi kuin kuvamäärä), päivä/yö (IR) ja
mediaanikitkan. Lisäksi miksi kuvia hylättiin ja kuinka kaukana kamerat ovat asemistaan.
Tulos myös tiedostoon out/counts.json.
"""
from __future__ import annotations

import argparse
import collections
import gzip
import io
import json
import math
import os
import statistics
import sys
import tarfile
from pathlib import Path

import requests
from PIL import Image, ImageStat

sys.path.insert(0, str(Path(__file__).parent))
from labels import CLASSES, label, station_index  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
CACHE = ROOT / "cache"
READY_CAMERAS = 30  # "tarpeeksi" = näin monta eri kameraa luokassa (alustava raja)


def is_ir(jpeg: bytes) -> bool:
    """Yökuva infrapunalla = käytännössä harmaasävy (värikanavat samat)."""
    im = Image.open(io.BytesIO(jpeg)).convert("RGB").resize((64, 36))
    r, g, b = (ImageStat.Stat(c).mean[0] for c in im.split())
    return abs(r - g) + abs(g - b) < 3


def station_coords() -> dict[int, tuple[float, float]]:
    f = CACHE / "weather_stations.json"
    if not f.exists():
        r = requests.get("https://tie.digitraffic.fi/api/weather/v1/stations",
                         headers={"Digitraffic-User": "Kelikamera-AI/0.1"}, timeout=30)
        r.raise_for_status()
        CACHE.mkdir(exist_ok=True)
        f.write_text(json.dumps({x["id"]: x["geometry"]["coordinates"][:2] for x in r.json()["features"]}))
    return {int(k): tuple(v) for k, v in json.loads(f.read_text()).items()}


def km(lat1, lon1, lat2, lon2) -> float:
    p = math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2
         + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 12742 * math.asin(math.sqrt(a))


def fetch_from_hf() -> None:
    from huggingface_hub import snapshot_download
    repo = os.environ.get("HF_REPO", "petudesign/kelikamera")
    snapshot_download(repo, repo_type="dataset", allow_patterns="data/**",
                      local_dir=OUT / "hf")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hf", action="store_true", help="lataa ajot ensin Hugging Facesta")
    args = ap.parse_args()
    if args.hf:
        fetch_from_hf()

    tars = sorted({p.name: p for p in OUT.glob("**/*.tar")}.values())  # sama ajo vain kerran
    coords = station_coords()

    per = {c: {"images": 0, "cameras": set(), "night": 0, "friction": []} for c in CLASSES}
    reasons = collections.Counter()
    dist = {}
    surface_only = 0

    for path in tars:
        t = tarfile.open(path)
        meta = json.load(t.extractfile("manifest.json"))
        stations = station_index(json.loads(gzip.decompress(t.extractfile("weather.json.gz").read())))
        for item in meta["items"]:
            if not item.get("surfaceView"):
                reasons["ei tienpintakulma"] += 1
                continue
            surface_only += 1
            lab = label(item, stations)
            st = coords.get(item.get("weatherStation"))
            if st:
                dist[item["camera"]] = km(item["lat"], item["lon"], st[1], st[0])
            if lab["class"] is None:
                reasons[lab["reason"]] += 1
                continue
            c = per[lab["class"]]
            c["images"] += 1
            c["cameras"].add(item["camera"])
            c["night"] += is_ir(t.extractfile(f"images/{item['preset']}.jpg").read())
            if lab["friction"] is not None:
                c["friction"].append(lab["friction"])

    print(f"Ajoja: {len(tars)} · tienpintakuvia: {surface_only}\n")
    print(f"{'luokka':<11}{'kuvia':>7}{'kameroita':>11}{'yö (IR)':>9}{'kitka med.':>12}  valmis?")
    summary = {}
    for cls in CLASSES:
        c = per[cls]
        fr = statistics.median(c["friction"]) if c["friction"] else None
        ready = len(c["cameras"]) >= READY_CAMERAS
        print(f"{cls:<11}{c['images']:>7}{len(c['cameras']):>11}{c['night']:>9}"
              f"{(f'{fr:.2f}' if fr is not None else '–'):>12}  {'✓' if ready else '–'}")
        summary[cls] = {"images": c["images"], "cameras": len(c["cameras"]), "night": c["night"],
                        "friction_median": fr, "ready": ready}

    print("\nHylätyt:")
    for r, n in reasons.most_common():
        print(f"  {n:>6}  {r}")
    if dist:
        d = sorted(dist.values())
        q = lambda p: d[min(len(d) - 1, int(p * len(d)))]
        print(f"\nKamera ↔ lähin asema: mediaani {q(.5):.1f} km, 75 % alle {q(.75):.1f} km, "
              f"90 % alle {q(.9):.1f} km, pisin {d[-1]:.1f} km")

    (OUT / "counts.json").write_text(json.dumps(
        {"runs": len(tars), "classes": summary, "rejected": dict(reasons),
         "camera_station_km": {"median": q(.5), "p90": q(.9)} if dist else None},
        ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
