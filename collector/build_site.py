"""Rakentaa karttasivun datan → site/data/latest.json ja site/data/warnings.json

  python collector/build_site.py

- Kamerat ja nykyhetken keli: uusin keruuajo (out/) + kameroiden metatiedot (cache/cameras.json).
- 24 h historia tunneittain: Digitrafficin asemakohtainen historia (v2, max 24 h) lähimmille
  asemille, joilla on optinen kelianturi. Ei riipu omasta arkistosta, joten aikajana toimii heti.
- Liikennesäävaroitukset: Ilmatieteen laitoksen CAP-syöte (fi + sv + en) sellaisenaan, alueet yksinkertaistettuina.

Kuvia ei kopioida sivulle: sivu näyttää Fintrafficin tuoreen kuvan suoraan heidän osoitteestaan.
"""
from __future__ import annotations

import gzip
import json
import sys
import tarfile
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from collect import camera_meta, get_json, weather_stations  # noqa: E402
from count import km  # noqa: E402
from labels import CLASS_OF_CODE, CLASSES, label, station_index  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
SITE_DATA = ROOT / "site" / "data"
MAX_KM = 5.0       # kauempana oleva asema ei kerro tämän kameran kelistä
HOURS = 24
SENSOR_CLASS = "OPTISEN_ANTURIN_KELI1"
SENSOR_FRICTION = "KITKA1_LUKU"
CAP_FEED = "https://alerts.fmi.fi/cap/feed/atom_fi-FI.xml"  # sisältää kaikki kielet
NS = {"a": "http://www.w3.org/2005/Atom", "c": "urn:oasis:names:tc:emergency:cap:1.2"}


def r2(x):
    return None if x is None else round(float(x), 2)


def t(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


# ------------------------------------------------------------------ history --
def sensor_ids() -> dict[str, int]:
    return {s["name"]: s["id"] for s in get_json("/api/weather/v2/sensors")["sensors"]}


def station_history(station: int, ids: dict[str, int], slots: list[datetime]) -> dict:
    """Tunneittainen sarja: kunkin tunnin viimeisin arvo (enintään 1 h vanha)."""
    frm, to = slots[0] - timedelta(hours=1), slots[-1]
    out = {}
    for key, name in (("c", SENSOR_CLASS), ("f", SENSOR_FRICTION)):
        try:
            d = get_json(f"/api/weather/v2/stations/{station}/data/history?sensorId={ids[name]}"
                         f"&from={frm:%Y-%m-%dT%H:%M:%SZ}&to={to:%Y-%m-%dT%H:%M:%SZ}")
        except Exception:
            out[key] = [None] * len(slots)
            continue
        vals = sorted((t(v["measuredTime"]), v["value"]) for v in d.get("sensorValues", []))
        series, i, last = [], 0, None
        for slot in slots:
            while i < len(vals) and vals[i][0] <= slot:
                last = vals[i]
                i += 1
            series.append(last[1] if last and slot - last[0] <= timedelta(hours=1) else None)
        out[key] = series
    return out


# ----------------------------------------------------------------- warnings --
def simplify(points: list[tuple[float, float]], tol: float = 0.01) -> list[tuple[float, float]]:
    """Douglas–Peucker. Varoitusalueet ovat kymmenientuhansien pisteiden polygoneja."""
    if len(points) < 3:
        return points
    if points[0] == points[-1]:  # suljettu rengas: jaa kauimmaisen pisteen kohdalta kahdeksi viivaksi
        x0, y0 = points[0]
        far = max(range(len(points)), key=lambda i: (points[i][0] - x0) ** 2 + (points[i][1] - y0) ** 2)
        return simplify(points[:far + 1], tol)[:-1] + simplify(points[far:], tol)
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = (dx * dx + dy * dy) ** 0.5 or 1e-12
    dmax, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        x, y = points[i]
        d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm
        if d > dmax:
            dmax, idx = d, i
    if dmax <= tol:
        return [points[0], points[-1]]
    return simplify(points[:idx + 1], tol)[:-1] + simplify(points[idx:], tol)


def traffic_warnings() -> list[dict]:
    """Voimassa olevat liikennesäävaroitukset. Jokaisessa CAP-viestissä on info-osa per kieli (fi/sv/en)."""
    root = ET.fromstring(requests.get(CAP_FEED, timeout=60).content)
    now, out = datetime.now(timezone.utc), []
    for alert in root.iter(f"{{{NS['c']}}}alert"):
        w = {"id": alert.findtext("c:identifier", namespaces=NS), "headline": {}, "description": {},
             "polygons": []}
        for info in alert.findall("c:info", NS):
            codes = [v.findtext("c:value", namespaces=NS) for v in info.findall("c:eventCode", NS)]
            if "trafficWeather" not in codes:
                continue
            lang = (info.findtext("c:language", namespaces=NS) or "")[:2]
            params = {p.findtext("c:valueName", namespaces=NS): p.findtext("c:value", namespaces=NS)
                      for p in info.findall("c:parameter", NS)}
            w.update({"color": params.get("color"), "cause": params.get("eventCause"),
                      "onset": info.findtext("c:onset", namespaces=NS),
                      "expires": info.findtext("c:expires", namespaces=NS)})
            w["headline"][lang] = info.findtext("c:headline", namespaces=NS)
            w["description"][lang] = info.findtext("c:description", namespaces=NS)
            if not w["polygons"]:
                for poly in info.iter(f"{{{NS['c']}}}polygon"):
                    pts = [tuple(map(float, p.split(",")))[::-1] for p in poly.text.split()]  # lat,lon → lon,lat
                    ring = [[round(x, 3), round(y, 3)] for x, y in simplify(pts)]
                    if len(ring) >= 4:
                        w["polygons"].append(ring)
        if w["headline"] and w["polygons"] and t(w["expires"]) > now:
            out.append(w)
    return out


# --------------------------------------------------------------------- main --
def main() -> None:
    tars = sorted({p.name: p for p in OUT.glob("**/*.tar")}.values())
    latest = None
    for p in reversed(tars):
        tf = tarfile.open(p)
        meta = json.load(tf.extractfile("manifest.json"))
        if meta["images"] >= 100:  # pikatestit pois
            latest = (meta, station_index(json.loads(gzip.decompress(tf.extractfile("weather.json.gz").read()))))
            break
    if not latest:
        raise SystemExit("Ei keruuajoja kansiossa out/")
    meta, stations = latest
    cam_meta = {c["id"]: c for c in camera_meta(None)}
    coords = {s["id"]: (s["lon"], s["lat"]) for s in weather_stations()}

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    slots = [now - timedelta(hours=HOURS - k) for k in range(HOURS + 1)]

    cams, need = [], set()
    for item in meta["items"]:
        st = coords.get(item.get("weatherStation"))
        d = km(item["lat"], item["lon"], st[1], st[0]) if st else None
        lab = label(item, stations)
        near = d is not None and d <= MAX_KM
        cls = lab["class"] if near else None
        m = cam_meta.get(item["camera"], {})
        if near and lab.get("optical_code") is not None:
            need.add(item["weatherStation"])
        cams.append({
            "id": item["camera"],
            "name": (item.get("cameraName") or item["camera"]).replace("_", " "),
            "names": m.get("names"),
            "road": item.get("road"), "sec": m.get("roadSection"), "dist": m.get("roadDistance"),
            "mun": item.get("municipality"),
            "lat": round(item["lat"], 5), "lon": round(item["lon"], 5),
            "img": f"https://weathercam.digitraffic.fi/{item['preset']}.jpg",
            "view": item.get("presetName"),
            "t": item["measuredTime"],
            "cls": cls,
            "why": None if cls else ("far" if d and d > MAX_KM else "nosensor"),
            "st": item.get("weatherStation"), "km": round(d, 1) if d is not None else None,
            "friction": r2(lab.get("friction")) if near else None,
            "water": r2(lab.get("water_mm")) if near else None,
            "snow": r2(lab.get("snow_mm")) if near else None,
            "ice": r2(lab.get("ice_mm")) if near else None,
            "roadT": r2(lab.get("road_temp")) if near else None,
            "airT": r2(lab.get("air_temp")) if near else None,
        })

    print(f"Historia {len(need)} asemalle…")
    ids = sensor_ids()
    with ThreadPoolExecutor(8) as ex:
        hist = dict(zip(need, ex.map(lambda s: station_history(s, ids, slots), need)))
    for c in cams:
        h = hist.get(c["st"]) if c["cls"] else None
        if h:
            c["h"] = [CLASSES.index(CLASS_OF_CODE[int(v)]) if v is not None and int(v) in CLASS_OF_CODE else -1
                      for v in h["c"]]
            c["hf"] = [r2(v) for v in h["f"]]

    counts = {k: 0 for k in CLASSES} | {"ei mittausta": 0}
    for c in cams:
        counts[c["cls"] or "ei mittausta"] += 1

    SITE_DATA.mkdir(parents=True, exist_ok=True)
    (SITE_DATA / "latest.json").write_text(json.dumps({
        "run": meta["startedAt"],
        "built": datetime.now(timezone.utc).isoformat(),
        "maxKm": MAX_KM,
        "classes": CLASSES,
        "times": [s.isoformat() for s in slots],
        "counts": counts,
        "cameras": cams,
    }, ensure_ascii=False, separators=(",", ":")))

    try:
        warns = traffic_warnings()
    except Exception as e:  # varoitusten puute ei saa kaataa sivun rakentamista
        print(f"  ! varoitukset: {e}", file=sys.stderr)
        warns = []
    (SITE_DATA / "warnings.json").write_text(json.dumps(
        {"fetched": datetime.now(timezone.utc).isoformat(),
         "source": "Ilmatieteen laitos, CC BY 4.0", "warnings": warns},
        ensure_ascii=False, separators=(",", ":")))

    with_hist = sum(1 for c in cams if c.get("h"))
    print(f"{len(cams)} kameraa, {with_hist} historialla, {len(warns)} liikennesäävaroitusta")
    print(counts)
    for f in ("latest.json", "warnings.json"):
        print(f"  site/data/{f}: {(SITE_DATA / f).stat().st_size / 1e3:.0f} kt")


if __name__ == "__main__":
    main()
