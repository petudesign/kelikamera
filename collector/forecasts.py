"""Sääennusteet arkistoon: Digitrafficin tieosuusennuste ja Ilmatieteen laitoksen ennuste asemille.

Ennusteita ei saa jälkikäteen historiasta, joten ne tallennetaan ajohetkeltä (3 päivän riskimallia varten).
"""
from __future__ import annotations

import re
import time
from datetime import datetime, timedelta, timezone

import requests

from digitraffic import get_json, weather_stations

FMI_WFS = "https://opendata.fmi.fi/wfs"
FMI_QUERY = "fmi::forecast::edited::weather::scandinavia::point::multipointcoverage"
FMI_PARAMS = ["Temperature", "DewPoint", "Humidity", "Precipitation1h", "TotalCloudCover", "WindSpeedMS"]
FMI_HOURS = 96
FMI_BATCH = 60  # asemia per pyyntö; URL:n pituus rajoittaa


def road_forecast() -> dict:
    data = get_json("/api/weather/v2/forecast-sections/forecasts")
    data["summary"] = {"sections": len(data.get("forecastSections", []))}
    return data


def fmi_forecast() -> dict:
    """Tiivis muoto: values[asema][aika] = arvot FMI_PARAMS-järjestyksessä."""
    stations = weather_stations()
    end = (datetime.now(timezone.utc) + timedelta(hours=FMI_HOURS)).strftime("%Y-%m-%dT%H:00:00Z")
    out = {"source": "Ilmatieteen laitos, avoin data, CC BY 4.0", "query": FMI_QUERY, "params": FMI_PARAMS,
           "fetched": datetime.now(timezone.utc).isoformat(), "stations": [], "times": None, "values": []}
    for i in range(0, len(stations), FMI_BATCH):
        batch = stations[i:i + FMI_BATCH]
        q = [("service", "WFS"), ("version", "2.0.0"), ("request", "getFeature"), ("storedquery_id", FMI_QUERY),
             ("parameters", ",".join(FMI_PARAMS)), ("timestep", "180"), ("endtime", end)]
        q += [("latlon", f"{s['lat']},{s['lon']}") for s in batch]
        r = requests.get(FMI_WFS, params=q, timeout=60)
        r.raise_for_status()
        pos = re.search(r"<gmlcov:positions>(.*?)</gmlcov:positions>", r.text, re.S)
        val = re.search(r"<gml:doubleOrNilReasonTupleList>(.*?)</gml:doubleOrNilReasonTupleList>", r.text, re.S)
        if not (pos and val):
            raise RuntimeError(f"tyhjä vastaus erälle {i}")
        p, v, n = pos.group(1).split(), val.group(1).split(), len(FMI_PARAMS)
        series: dict[tuple, list] = {}
        for idx, k in enumerate(range(0, len(p), 3)):
            vals = [None if x == "NaN" else float(x) for x in v[idx * n:(idx + 1) * n]]
            series.setdefault((round(float(p[k]), 2), round(float(p[k + 1]), 2)), []).append((int(p[k + 2]), vals))
        for s in batch:
            pts = sorted(series.get((round(s["lat"], 2), round(s["lon"], 2)), []))
            if not pts:
                continue
            out["times"] = out["times"] or [t for t, _ in pts]
            out["stations"].append(s["id"])
            out["values"].append([vals for _, vals in pts])
        time.sleep(0.5)
    out["summary"] = {"stations": len(out["stations"]), "times": len(out["times"] or [])}
    return out
