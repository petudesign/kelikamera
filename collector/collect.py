"""Kelikamera AI – keräin.

Yksi ajo = yksi tar-tiedosto, jossa:
  images/<presetId>.jpg   kelikameran kuva pienennettynä (leveys IMG_WIDTH)
  manifest.json           jokaisen kuvan metatiedot + lähimmän sääaseman id
  weather.json.gz         kaikkien tiesääasemien raaka-anturidata samalta hetkeltä

Tiedosto tallentuu kansioon out/YYYY/MM/DD/. Jos ympäristössä on HF_TOKEN ja
HF_REPO, tiedosto ladataan myös Hugging Face -datasettiin (yksityinen).

Käyttö:
  python collector/collect.py              # kaikki kamerat
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
MAX_IMAGE_AGE = timedelta(hours=2)   # vanhempi kuva = kamera jumissa, ei tallenneta
META_MAX_AGE = timedelta(days=7)     # kameroiden metatiedot muuttuvat harvoin
WORKERS = 8

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
        if age < META_MAX_AGE:
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
            "lat": lat,
            "lon": lon,
            "municipality": p.get("municipality"),
            "province": p.get("province"),
            "road": (p.get("roadAddress") or {}).get("roadNumber"),
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
            {"fetched": datetime.now(timezone.utc).isoformat(), "cameras": cams},
            ensure_ascii=False))
    return cams


def pick_preset(cam: dict) -> dict:
    """Yksi kulma per kamera: 'Tienpinta' (suunta 9) jos on, muuten ensimmäinen."""
    for p in cam["presets"]:
        if p.get("directionCode") == "9":
            return p
    return cam["presets"][0]


# ------------------------------------------------------------------ images --
def fetch_image(preset_id: str) -> bytes | None:
    try:
        r = session.get(f"https://weathercam.digitraffic.fi/{preset_id}.jpg", timeout=30)
        r.raise_for_status()
        im = Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as e:  # verkko- tai kuvavirhe: ohitetaan tämä kamera
        print(f"  ! {preset_id}: {e}", file=sys.stderr)
        return None
    if im.width > IMG_WIDTH:
        im = im.resize((IMG_WIDTH, round(im.height * IMG_WIDTH / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()


# --------------------------------------------------------------------- run --
def run(limit: int | None) -> Path:
    started = datetime.now(timezone.utc)
    stamp = started.strftime("%Y%m%dT%H%MZ")
    print(f"Ajo {stamp}")

    cams = camera_meta(limit)
    print(f"  kameroita: {len(cams)}")

    measured = {
        p["id"]: p.get("measuredTime")
        for s in get_json("/api/weathercam/v1/stations/data")["stations"]
        for p in s.get("presets", [])
    }
    weather_raw = get_json("/api/weather/v1/stations/data")

    chosen = []
    skipped = {"stale": 0, "no_time": 0, "failed": 0}
    for cam in cams:
        p = pick_preset(cam)
        t = parse_time(measured.get(p["id"]))
        if t is None:
            skipped["no_time"] += 1
            continue
        if started - t > MAX_IMAGE_AGE:
            skipped["stale"] += 1
            continue
        chosen.append((cam, p, t))

    with ThreadPoolExecutor(WORKERS) as ex:
        images = list(ex.map(lambda c: fetch_image(c[1]["id"]), chosen))

    manifest = []
    tar_buf = io.BytesIO()
    with tarfile.open(fileobj=tar_buf, mode="w") as tar:
        def add(name: str, data: bytes):
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mtime = int(started.timestamp())
            tar.addfile(info, io.BytesIO(data))

        for (cam, p, t), img in zip(chosen, images):
            if img is None:
                skipped["failed"] += 1
                continue
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
                "weatherStation": cam["nearestWeatherStationId"],
                "measuredTime": t.isoformat(),
                "bytes": len(img),
            })

        meta = {
            "run": stamp,
            "startedAt": started.isoformat(),
            "finishedAt": datetime.now(timezone.utc).isoformat(),
            "imageWidth": IMG_WIDTH,
            "images": len(manifest),
            "skipped": skipped,
            "source": "Fintraffic / digitraffic.fi, CC BY 4.0",
            "items": manifest,
        }
        add("manifest.json", json.dumps(meta, ensure_ascii=False, indent=1).encode())
        add("weather.json.gz", gzip.compress(json.dumps(weather_raw).encode()))

    day_dir = OUT / started.strftime("%Y/%m/%d")
    day_dir.mkdir(parents=True, exist_ok=True)
    path = day_dir / f"{stamp}.tar"
    path.write_bytes(tar_buf.getvalue())

    secs = (datetime.now(timezone.utc) - started).total_seconds()
    print(f"  kuvia: {len(manifest)}, ohitettu: {skipped}")
    print(f"  tiedosto: {path.relative_to(ROOT)} ({path.stat().st_size / 1e6:.1f} Mt), {secs:.0f} s")
    return path


def upload(path: Path) -> None:
    token, repo = os.environ.get("HF_TOKEN"), os.environ.get("HF_REPO")
    if not (token and repo):
        if os.environ.get("GITHUB_ACTIONS"):
            # Pilvessä puuttuva asetus on virhe: muuten data katoaisi hiljaa.
            raise SystemExit("HF_TOKEN-salaisuus tai HF_REPO-muuttuja puuttuu repon asetuksista")
        print("  (HF_TOKEN/HF_REPO puuttuu – ei ladata Hugging Faceen)")
        return
    from huggingface_hub import HfApi

    api = HfApi(token=token)
    api.create_repo(repo, repo_type="dataset", private=True, exist_ok=True)
    dest = "data/" + str(path.relative_to(OUT))
    api.upload_file(path_or_fileobj=str(path), path_in_repo=dest, repo_id=repo,
                    repo_type="dataset", commit_message=f"Keruu {path.stem}")
    print(f"  ladattu: {repo}/{dest}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="vain N ensimmäistä kameraa (testi)")
    args = ap.parse_args()
    upload(run(args.limit))
