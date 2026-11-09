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

MAX_SENSOR_GAP_MIN = 30  # anturimittaus enintään näin kaukana kuvan ajasta


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
    s = stations.get(item.get("weatherStation"))
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
    if img_t and opt["time"] and abs((img_t - opt["time"]).total_seconds()) > MAX_SENSOR_GAP_MIN * 60:
        out["reason"] = "anturi ja kuva eri aikaan"
        return out
    code = int(opt["value"])
    cls = CLASS_OF_CODE.get(code)
    if cls is None:
        out["reason"] = f"koodi {code} ({OPTICAL_CODES.get(code, 'tuntematon')})"
        return out
    out["class"] = cls
    return out
