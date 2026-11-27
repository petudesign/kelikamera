"""Digitrafficin rajapinnat: kamerat, kuvat, tiesääasemat ja niiden 24 h historia."""
from __future__ import annotations

import io
import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from PIL import Image

from labels import parse_time

API = "https://tie.digitraffic.fi"
CACHE = Path(__file__).resolve().parent.parent / "cache"
CACHE_MAX_AGE = timedelta(days=7)
CAMERA_META_VERSION = 3  # nosta, kun kameran metatietoihin lisätään kenttiä
IMG_WIDTH = 640
JPEG_QUALITY = 80
WORKERS = 8

_TLS = threading.local()


def _session() -> requests.Session:
    """Säiekohtainen requests.Session (requests.Session ei ole säieturvallinen)."""
    s = getattr(_TLS, "session", None)
    if s is None:
        s = requests.Session()
        s.headers.update({"Digitraffic-User": "Kelikamera-AI/0.1", "Accept-Encoding": "gzip"})
        _TLS.session = s
    return s


def get_json(path: str) -> dict:
    for attempt in range(3):
        try:
            r = _session().get(API + path, timeout=30)
            r.raise_for_status()
            return r.json()
        except (requests.RequestException, ValueError):
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))
    raise RuntimeError("unreachable")


def _cached(name: str, version: int | None = None):
    f = CACHE / name
    if not f.exists():
        return None
    try:
        data = json.loads(f.read_text())
        fetched = parse_time(data.get("fetched"))
    except (ValueError, OSError, AttributeError) as e:
        print(f"  ! välimuisti {name}: {e}", file=sys.stderr)
        return None
    if fetched is None:
        return None
    fresh = datetime.now(timezone.utc) - fetched < CACHE_MAX_AGE
    return data if fresh and data.get("v") == version else None


def _store(name: str, data: dict, version: int | None = None) -> None:
    CACHE.mkdir(exist_ok=True)
    (CACHE / name).write_text(json.dumps(
        {"v": version, "fetched": datetime.now(timezone.utc).isoformat(), **data}, ensure_ascii=False))


def camera_meta(limit: int | None = None) -> list[dict]:
    """Kamerat: sijainti, tieosoite, lähin sääasema ja kuvakulmat."""
    if cached := _cached("cameras.json", CAMERA_META_VERSION):
        return cached["cameras"][:limit] if limit else cached["cameras"]

    ids = [f["id"] for f in get_json("/api/weathercam/v1/stations")["features"]][:limit]

    def detail(cid: str) -> dict | None:
        try:
            f = get_json(f"/api/weathercam/v1/stations/{cid}")
        except requests.RequestException as e:
            print(f"  ! {cid}: {e}", file=sys.stderr)
            return None
        p, road = f["properties"], f["properties"].get("roadAddress") or {}
        lon, lat = f["geometry"]["coordinates"][:2]
        return {
            "id": cid, "name": p.get("name"), "names": p.get("names"), "lat": lat, "lon": lon,
            "municipality": p.get("municipality"), "province": p.get("province"),
            "road": road.get("roadNumber"), "roadSection": road.get("roadSection"),
            "roadDistance": road.get("distanceFromRoadSectionStart"),
            "nearestWeatherStationId": p.get("nearestWeatherStationId"),
            "presets": [{"id": s["id"], "name": s.get("presentationName"), "directionCode": s.get("directionCode")}
                        for s in p.get("presets", []) if s.get("inCollection")],
        }

    with ThreadPoolExecutor(WORKERS) as ex:
        cams = [c for c in ex.map(detail, ids) if c and c["presets"]]
    if not limit:
        _store("cameras.json", {"cameras": cams}, CAMERA_META_VERSION)
    return cams


def pick_preset(cam: dict) -> dict:
    """Yksi kuvakulma kameraa kohden: tienpinta (suuntakoodi 9), jos sellainen on."""
    return next((p for p in cam["presets"] if p.get("directionCode") == "9"), cam["presets"][0])


def weather_stations() -> list[dict]:
    if cached := _cached("weather_stations_v2.json"):
        return cached["stations"]
    st = [{"id": x["id"], "lon": round(x["geometry"]["coordinates"][0], 4), "lat": round(x["geometry"]["coordinates"][1], 4)}
          for x in get_json("/api/weather/v2/stations")["features"]]
    _store("weather_stations_v2.json", {"stations": st})
    return st


def station_coords() -> dict[int, tuple[float, float]]:
    return {s["id"]: (s["lon"], s["lat"]) for s in weather_stations()}


def sensor_names() -> dict[int, str]:
    return {s["id"]: s["name"] for s in get_json("/api/weather/v2/sensors")["sensors"]}


def camera_history() -> dict[str, list[tuple[datetime, str]]]:
    """Kaikkien kuvakulmien kuvat ~23 h ajalta: {kulma: [(ottoaika, osoite), …]} aikajärjestyksessä."""
    d = get_json("/api/weathercam/v1/stations/history")
    return {p["id"]: sorted((parse_time(h["lastModified"]), h["imageUrl"]) for h in p.get("history", [])
                            if h.get("lastModified") and h.get("imageUrl"))
            for s in d.get("stations", []) for p in s.get("presets", [])}


def station_series(sid: int, frm: datetime, to: datetime, names: dict[int, str]) -> dict[str, list[tuple]]:
    """Aseman kaikki anturit 5 min välein: {anturi: [(aika, arvo), …]} aikajärjestyksessä."""
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
    return series


def fetch_image(url: str) -> bytes | None:
    """Kuva pienennettynä JPEG:ksi. Kuvapalvelin katkaisee joskus siirron, joten kolme yritystä."""
    for attempt in range(3):
        try:
            r = _session().get(url, timeout=30)
            r.raise_for_status()
            im = Image.open(io.BytesIO(r.content)).convert("RGB")
            break
        except Exception as e:
            if attempt == 2:
                print(f"  ! {url.split('?')[0]}: {e}", file=sys.stderr)
                return None
            time.sleep(1 + attempt)
    if im.width > IMG_WIDTH:
        im = im.resize((IMG_WIDTH, round(im.height * IMG_WIDTH / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()
