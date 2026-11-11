"""Tunnisteet: kamerakuvalle keli lähimmän tiesääaseman antureista.

Perustelut ja lähteet: DECISIONS.md, merkintä "Tunnisteiden lähde".

Pääasiallinen lähde on optinen DSC-kelianturi (OPTISEN_ANTURIN_KELI1 + mitatut määrät).
Sen koodit tulkitaan Fintraffiicin KELI-koodiston mukaan (tmfg/digitraffic-road,
V1.4.12__Sensor_value_descriptions.sql), ja tulkinta on tarkistettu datasta: esim. koodi 7
→ jäätä 1,8 mm ja kitka 0,11. TIENPINNAN_TILA_1:lle ei ole julkaistua koodistoa, joten sitä
ei käytetä luokkana, vaan se tallennetaan raakana.
"""
from __future__ import annotations

from datetime import datetime

# Fintraffic KELI-koodisto (sensor_value_description, sensorit 23/24)
OPTICAL_CODES = {
    0: "vika",
    1: "kuiva",
    2: "kostea",
    3: "märkä",
    4: "märkä ja suolattu",
    5: "kuura",
    6: "lumi",
    7: "jää",
    8: "todennäköisesti kostea ja suolainen",
    9: "sohjoinen",
}

# Mallin luokat. Harvinaiset alaluokat yhdistetään, koska niitä on liian vähän erikseen
# ja kuljettajan kannalta ero on pieni.
CLASS_OF_CODE = {
    1: "kuiva",
    2: "kostea",
    3: "märkä", 4: "märkä", 8: "kostea",
    6: "luminen", 9: "luminen",
    5: "jää/kuura", 7: "jää/kuura",
}
CLASSES = ["kuiva", "kostea", "märkä", "luminen", "jää/kuura"]

MAX_SENSOR_GAP_MIN = 30  # vanha muoto: anturimittaus (ajohetkeltä) enintään näin kaukana kuvan ajasta
MAX_SENSOR_GAP_MIN_V2 = 10
# Ohut kerros (DECISIONS.md 2026-11-11): anturi sanoo lumi/jää, mutta kitka on hyvä ja kerros ohut.
# Luokka säilyy, mutta 'thin' = True, ja ensimmäinen malli jättää nämä luokkakoulutuksen ulkopuolelle.
THIN_MIN_FRICTION = 0.6
THIN_MAX_LAYER_MM = 0.1  # format 2: anturiarvo haettu historiasta kuvan ottohetkeltä


def _t(s: str | None) -> datetime | None:
    return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None


def station_index(weather_raw: dict) -> dict[int, dict[str, dict]]:
    """{asema_id: {anturin_nimi: {'value':…, 'time': datetime}}}"""
    return {
        s["id"]: {
            v["name"]: {"value": v.get("value"), "time": _t(v.get("measuredTime"))}
            for v in s.get("sensorValues", [])
        }
        for s in weather_raw.get("stations", [])
    }


def label(item: dict, stations: dict[int, dict[str, dict]]) -> dict:
    """Tunniste yhdelle manifestin kuvalle. Palauttaa aina dictin; 'class' None = ei käyttökelpoinen."""
    out = {"class": None, "reason": None}
    if "sensors" in item:  # format 2: anturit kuvan ottohetkellä suoraan manifestissa
        s = {k: {"value": v.get("value"), "time": _t(v.get("measuredTime"))} for k, v in item["sensors"].items()}
        max_gap = MAX_SENSOR_GAP_MIN_V2
    else:
        s = stations.get(item.get("weatherStation"))
        max_gap = MAX_SENSOR_GAP_MIN
    if not s:
        out["reason"] = "ei asemadataa"
        return out

    def val(name):
        return (s.get(name) or {}).get("value")

    out.update({
        "friction": val("KITKA1_LUKU"),
        "water_mm": val("VEDEN_MÄÄRÄ1"),
        "snow_mm": val("LUMEN_MÄÄRÄ1"),
        "ice_mm": val("JÄÄN_MÄÄRÄ1"),
        "road_temp": val("TIE_1"),
        "air_temp": val("ILMA"),
        "surface_state_raw": val("TIENPINNAN_TILA_1"),
        "optical_code": val("OPTISEN_ANTURIN_KELI1"),
    })

    opt = s.get("OPTISEN_ANTURIN_KELI1")
    if not opt or opt["value"] is None:
        out["reason"] = "ei optista anturia"
        return out
    img_t = _t(item.get("measuredTime"))
    if img_t and opt["time"] and abs((img_t - opt["time"]).total_seconds()) > max_gap * 60:
        out["reason"] = "anturi ja kuva eri aikaan"
        return out
    code = int(opt["value"])
    cls = CLASS_OF_CODE.get(code)
    if cls is None:
        out["reason"] = f"koodi {code} ({OPTICAL_CODES.get(code, 'tuntematon')})"
        return out
    out["class"] = cls
    layer = max(out.get("ice_mm") or 0, out.get("snow_mm") or 0)
    out["thin"] = (cls in ("luminen", "jää/kuura") and out.get("friction") is not None
                   and out["friction"] >= THIN_MIN_FRICTION and layer < THIN_MAX_LAYER_MM)
    return out
