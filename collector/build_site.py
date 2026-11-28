"""Rakentaa karttasivun datan → site/data/latest.json ja site/data/warnings.json

  python collector/build_site.py

- Kamerat ja nykyhetken keli: suoraan Digitrafficista rakennushetkellä (kamerarajapinta + sääasemat v2),
  kameroiden metatiedot välimuistista (cache/cameras.json). Ei riipu kuvien keruusta.
- 24 h historia tunneittain: Digitrafficin asemakohtainen historia (v2, max 24 h) lähimmille
  asemille, joilla on optinen kelianturi. Ei riipu omasta arkistosta, joten aikajana toimii heti.
- Liikennesäävaroitukset: Ilmatieteen laitoksen CAP-syöte (fi + sv + en) sellaisenaan, alueet yksinkertaistettuina.

Kuvia ei kopioida sivulle: sivu näyttää Fintrafficin tuoreen kuvan suoraan heidän osoitteestaan.
"""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from digitraffic import camera_meta, get_json, pick_preset, sensor_names, weather_stations  # noqa: E402
from labels import (CLASS_OF_CODE, CLASSES, MAX_KM, THIN_MAX_LAYER_MM, THIN_MIN_FRICTION,  # noqa: E402
                    is_thin, label, parse_time, station_index)
from summary import km  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SITE_DATA = ROOT / "site" / "data"
HOURS = 24
SENSOR_MAX_AGE = timedelta(minutes=90)  # vanhempi anturilukema ei kerro nykytilasta
SENSOR_CLASS = "OPTISEN_ANTURIN_KELI1"
SENSOR_FRICTION = "KITKA1_LUKU"
SENSOR_SNOW = "LUMEN_MÄÄRÄ1"
SENSOR_ICE = "JÄÄN_MÄÄRÄ1"
CAP_FEED = "https://alerts.fmi.fi/cap/feed/atom_fi-FI.xml"  # sisältää kaikki kielet
NS = {"a": "http://www.w3.org/2005/Atom", "c": "urn:oasis:names:tc:emergency:cap:1.2"}


def r2(x):
    return None if x is None else round(float(x), 2)


# ------------------------------------------------------------------ history --
def sensor_ids() -> dict[str, int]:
    return {name: sid for sid, name in sensor_names().items()}


def station_history(station: int, ids: dict[str, int], slots: list[datetime], sensors: dict[str, str]) -> dict:
    """Tunneittainen sarja anturia kohden: kunkin tunnin viimeisin arvo (enintään 1 h vanha)."""
    frm, to = slots[0] - timedelta(hours=1), slots[-1]
    out = {}
    for key, name in sensors.items():
        try:
            d = get_json(f"/api/weather/v2/stations/{station}/data/history?sensorId={ids[name]}"
                         f"&from={frm:%Y-%m-%dT%H:%M:%SZ}&to={to:%Y-%m-%dT%H:%M:%SZ}")
        except (requests.RequestException, KeyError, ValueError) as e:
            print(f"  ! historia asema {station} ({name}): {e}", file=sys.stderr)
            out[key] = [None] * len(slots)
            continue
        vals = sorted((parse_time(v["measuredTime"]), v["value"]) for v in d.get("sensorValues", []) if v.get("measuredTime"))
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
    resp = requests.get(CAP_FEED, timeout=60)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
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
                    if not poly.text:
                        continue
                    pts = [tuple(map(float, p.split(",")))[::-1] for p in poly.text.split()]  # lat,lon → lon,lat
                    ring = [[round(x, 3), round(y, 3)] for x, y in simplify(pts)]
                    if len(ring) >= 4:
                        w["polygons"].append(ring)
        exp = parse_time(w.get("expires"))
        if w["headline"] and w["polygons"] and exp and exp > now:
            out.append(w)
    return out


# ------------------------------------------------------------------ traffic --
MAINT_TASKS = {
    "SALTING": "salt",
    "PREWETTED_SALTING": "salt",
    "PLOUGHING_AND_SLUSH_REMOVAL": "plow",
    "LINE_SANDING": "sand",
    "SPOT_SANDING": "sand",
}


def tms_stations() -> list[dict]:
    """LAM-liikennemittausasemat (id, lat, lon), vain toiminnassa olevat."""
    out = []
    for f in get_json("/api/tms/v1/stations").get("features", []):
        coords = (f.get("geometry") or {}).get("coordinates") or []
        p = f.get("properties") or {}
        if p.get("collectionStatus") != "GATHERING":
            continue
        if len(coords) >= 2 and p.get("id") is not None:
            out.append({"id": int(p["id"]), "lon": float(coords[0]), "lat": float(coords[1])})
    return out


def nearest_tms(lat: float, lon: float, stations: list[dict]) -> tuple[int | None, float | None]:
    best_id, best_d = None, MAX_KM
    for s in stations:
        if abs(s["lat"] - lat) > 0.06 or abs(s["lon"] - lon) > 0.12:
            continue
        d = km(lat, lon, s["lat"], s["lon"])
        if d <= best_d:
            best_id, best_d = s["id"], d
    return best_id, (round(best_d, 1) if best_id is not None else None)


def traffic_messages() -> list[dict]:
    """Voimassa olevat tietyöt ja liikennetiedotteet tiivistettynä karttapisteiksi."""
    d = get_json("/api/traffic-message/v1/messages?inactiveHours=0&includeAreaGeometry=false"
                 "&situationType=ROAD_WORK&situationType=TRAFFIC_ANNOUNCEMENT")
    out = []
    for f in d.get("features", []):
        coords = (f.get("geometry") or {}).get("coordinates")
        if not coords:
            continue
        pt = coords
        while isinstance(pt, list) and pt and isinstance(pt[0], list):
            pt = pt[len(pt) // 2] if len(pt) > 2 else pt[0]
        if not isinstance(pt, list) or len(pt) < 2:
            continue
        p = f.get("properties") or {}
        anns = p.get("announcements") or []
        fi = next((a for a in anns if a.get("language") == "fi"), anns[0] if anns else {})
        en = next((a for a in anns if a.get("language") == "en"), {})
        title_fi = (fi.get("title") or "").strip()
        if not title_fi:
            continue
        td = fi.get("timeAndDuration") or {}
        out.append({
            "id": p.get("situationId"),
            "type": "work" if p.get("situationType") == "ROAD_WORK" else "notice",
            "lon": round(float(pt[0]), 4), "lat": round(float(pt[1]), 4),
            "t": {"fi": title_fi, "en": (en.get("title") or title_fi).strip()},
            "d": {"fi": (fi.get("comment") or (fi.get("location") or {}).get("description") or "").strip()[:260],
                  "en": (en.get("comment") or (en.get("location") or {}).get("description") or "").strip()[:260]},
            "start": td.get("startTime"),
            "end": td.get("endTime"),
        })
    return out


def maintenance_routes(started: datetime) -> list[list]:
    """Viimeisen 3 tunnin talvikunnossapito (suolaus, auraus, hiekoitus) tiivistettyinä viivoina."""
    frm = (started - timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    d = get_json(f"/api/maintenance/v1/tracking/routes?endFrom={frm}&xMin=19&yMin=59.5&xMax=32&yMax=70.5")
    out = []
    for f in d.get("features", []):
        p = f.get("properties") or {}
        kind = next((MAINT_TASKS[t] for t in (p.get("tasks") or []) if t in MAINT_TASKS), None)
        if not kind:
            continue
        g = f.get("geometry") or {}
        cs = g.get("coordinates") or []
        if g.get("type") == "LineString" and len(cs) >= 2:
            pts = [cs[0], cs[len(cs) // 2], cs[-1]] if len(cs) > 2 else cs
            out.append([kind, [[round(x[0], 3), round(x[1], 3)] for x in pts]])
    return out


# --------------------------------------------------------------------- main --
def fetch_cameras(started: datetime) -> tuple[list[dict], set[int]]:
    cam_meta = {c["id"]: c for c in camera_meta(None)}
    coords = {s["id"]: (s["lon"], s["lat"]) for s in weather_stations()}
    try:
        tms = tms_stations()
    except Exception as e:
        print(f"  ! LAM-asemat: {e}", file=sys.stderr)
        tms = []
    measured = {p["id"]: p.get("measuredTime")
                for st in get_json("/api/weathercam/v1/stations/data")["stations"] for p in st.get("presets", [])}
    stations = station_index(get_json("/api/weather/v2/stations/data"))
    items = []
    for cam in cam_meta.values():
        pr = pick_preset(cam)
        mt = measured.get(pr["id"])
        mt_dt = parse_time(mt)
        if not mt_dt or started - mt_dt > timedelta(hours=2):  # kamera jumissa
            continue
        items.append({"camera": cam["id"], "cameraName": cam.get("name"), "lat": cam["lat"], "lon": cam["lon"],
                      "road": cam.get("road"), "municipality": cam.get("municipality"),
                      "weatherStation": cam.get("nearestWeatherStationId"),
                      "preset": pr["id"], "presetName": pr.get("name"), "measuredTime": mt})

    cams, need = [], set()
    for item in items:
        st = coords.get(item.get("weatherStation"))
        d = km(item["lat"], item["lon"], st[1], st[0]) if st else None
        # Kartalle tuorein anturilukema riippumatta kameran kuvaushetkestä (kamerat kuvaavat usein vain
        # kerran tunnissa). Opetusdatan 30 min sääntö koskee vain keruuta, ei karttaa.
        lab = label({**item, "measuredTime": None}, stations)
        opt = (stations.get(item.get("weatherStation")) or {}).get("OPTISEN_ANTURIN_KELI1") or {}
        if lab["class"] and (not opt.get("time") or started - opt["time"] > SENSOR_MAX_AGE):
            lab["class"], lab["reason"] = None, "anturilukema vanha"
        near = d is not None and d <= MAX_KM
        cls = lab["class"] if near else None
        m = cam_meta.get(item["camera"], {})
        tms_id, tms_km = nearest_tms(item["lat"], item["lon"], tms) if tms else (None, None)
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
            # anturin oma mittausaika (optinen kelianturi), ei kamerakuvan aika
            "mt": (opt["time"].isoformat() if opt.get("time") else None) if near else None,
            "cls": cls,
            "why": None if cls else ("far" if d and d > MAX_KM else "nosensor"),
            "st": item.get("weatherStation"), "km": round(d, 1) if d is not None else None,
            "tms": tms_id, "tmsKm": tms_km,
            "friction": r2(lab.get("friction")) if near else None,
            "water": r2(lab.get("water_mm")) if near else None,
            "snow": r2(lab.get("snow_mm")) if near else None,
            "ice": r2(lab.get("ice_mm")) if near else None,
            "thin": bool(near and lab.get("thin")),
            "roadT": r2(lab.get("road_temp")) if near else None,
            "roadTr": r2(lab.get("road_temp_rate")) if near else None,
            "airT": r2(lab.get("air_temp")) if near else None,
        })
    return cams, need


def attach_history(cams: list[dict], need: set[int], slots: list[datetime]) -> None:
    print(f"Historia {len(need)} asemalle…")
    ids = sensor_ids()
    with ThreadPoolExecutor(8) as ex:
        hist = dict(zip(need, ex.map(
            lambda s: station_history(s, ids, slots, {"c": SENSOR_CLASS, "f": SENSOR_FRICTION}), need)))
        classes = {st: [CLASS_OF_CODE.get(int(v)) if v is not None else None for v in h["c"]] for st, h in hist.items()}
        # Kerroksen paksuus haetaan vain asemille, joilla jokin tunti voi olla ohut kerros (lumi tai jää, pito hyvä)
        maybe_thin = [st for st, h in hist.items()
                      if any(is_thin(k, f, None, None) for k, f in zip(classes[st], h["f"]))]
        for st, layers in zip(maybe_thin, ex.map(
                lambda s: station_history(s, ids, slots, {"s": SENSOR_SNOW, "i": SENSOR_ICE}), maybe_thin)):
            hist[st] |= layers
    for c in cams:
        h = hist.get(c["st"]) if c["cls"] else None
        if h:
            ks = classes[c["st"]]
            c["h"] = [CLASSES.index(k) if k else -1 for k in ks]
            c["hf"] = [r2(v) for v in h["f"]]
            c["th"] = [i for i, (k, f) in enumerate(zip(ks, h["f"]))
                       if "s" in h and is_thin(k, f, h["i"][i], h["s"][i])]


def write_outputs(started: datetime, slots: list[datetime], cams: list[dict]) -> None:
    counts = {k: 0 for k in CLASSES} | {"ei mittausta": 0}
    for c in cams:
        counts[c["cls"] or "ei mittausta"] += 1

    SITE_DATA.mkdir(parents=True, exist_ok=True)
    (SITE_DATA / "latest.json").write_text(json.dumps({
        "run": started.isoformat(),
        "built": datetime.now(timezone.utc).isoformat(),
        "maxKm": MAX_KM,
        "classes": CLASSES,
        # selain päivittää nykytilan suoraan Digitrafficista samoilla säännöillä (site/js/live.js)
        "rules": {"codes": {str(k): v for k, v in CLASS_OF_CODE.items()}, "maxAgeMin": SENSOR_MAX_AGE.seconds // 60,
                  "thinFriction": THIN_MIN_FRICTION, "thinLayer": THIN_MAX_LAYER_MM},
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

    try:
        msgs = traffic_messages()
    except Exception as e:
        print(f"  ! liikennetiedotteet: {e}", file=sys.stderr)
        msgs = []
    (SITE_DATA / "traffic.json").write_text(json.dumps(
        {"fetched": datetime.now(timezone.utc).isoformat(), "messages": msgs},
        ensure_ascii=False, separators=(",", ":")))

    try:
        maint = maintenance_routes(started)
    except Exception as e:
        print(f"  ! kunnossapito: {e}", file=sys.stderr)
        maint = []
    (SITE_DATA / "maintenance.json").write_text(json.dumps(
        {"fetched": datetime.now(timezone.utc).isoformat(), "hours": 3, "lines": maint},
        ensure_ascii=False, separators=(",", ":")))

    with_hist = sum(1 for c in cams if c.get("h"))
    print(f"{len(cams)} kameraa, {with_hist} historialla, {len(warns)} varoitusta, {len(msgs)} tiedotetta, {len(maint)} aurauspätkää")
    print(counts)
    for f in ("latest.json", "warnings.json", "traffic.json", "maintenance.json"):
        print(f"  site/data/{f}: {(SITE_DATA / f).stat().st_size / 1e3:.0f} kt")


def main() -> None:
    # Nykytila suoraan Digitrafficista, ei keruuajosta: sivu voi päivittyä useammin kuin kuvia kerätään.
    started = datetime.now(timezone.utc)
    now = started.replace(minute=0, second=0, microsecond=0)
    slots = [now - timedelta(hours=HOURS - k) for k in range(HOURS + 1)]
    cams, need = fetch_cameras(started)
    attach_history(cams, need, slots)
    write_outputs(started, slots, cams)


def stamp_assets() -> None:
    """Skriptien ja tyylien osoitteisiin sisällön tiiviste (?v=…). GitHub Pagesin 10 min välimuisti antoi
    muuten uuden sivun kanssa vanhan skriptin (DECISIONS.md 2026-11-13)."""
    import hashlib
    import re
    site = ROOT / "site"
    html = (site / "index.html").read_text()

    def stamp(m: re.Match) -> str:
        attr, rel = m.group(1), m.group(2)
        v = hashlib.sha1((site / rel).read_bytes()).hexdigest()[:10]
        return f'{attr}="{rel}?v={v}"'

    new = re.sub(r'(src|href)="((?:js|css)/[\w-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?"', stamp, html)
    if new != html:
        (site / "index.html").write_text(new)


if __name__ == "__main__":
    main()
    stamp_assets()
