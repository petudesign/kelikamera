"""Tunnisteyhteenveto: yksi pieni JSON jokaisesta keruutiedostosta (DECISIONS.md 2026-11-17).

Luokkalaskuri tarvitsee vain tunnisteet, ei kuvia. Kun jokaisen <hetki>.tar:n rinnalla on
<hetki>.labels.json (muutama kt), opetusdatan valmiuden voi laskea lataamatta gigatavuja kuvia.

  python collector/summary.py out/2026/11/13/20261113T0300Z.tar   # tulostaa yhteenvedon
"""
from __future__ import annotations

import gzip
import io
import json
import math
import sys
import tarfile
from pathlib import Path

from PIL import Image, ImageStat

sys.path.insert(0, str(Path(__file__).parent))
from labels import label, station_index  # noqa: E402

SUMMARY_VERSION = 1


def is_ir(jpeg: bytes) -> bool:
    """Yökuva infrapunalla = käytännössä harmaasävy (värikanavat samat)."""
    im = Image.open(io.BytesIO(jpeg)).convert("RGB").resize((64, 36))
    r, g, b = (ImageStat.Stat(c).mean[0] for c in im.split())
    return abs(r - g) + abs(g - b) < 3


def km(lat1, lon1, lat2, lon2) -> float:
    p = math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2
         + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2)
    return 12742 * math.asin(math.sqrt(a))


def summarize(tar_path: Path, coords: dict[int, tuple[float, float]]) -> dict:
    """Keruutiedoston tunnisteet. coords = {asema_id: (lon, lat)} kameran ja aseman etäisyyttä varten."""
    with tarfile.open(tar_path) as t:
        meta = json.load(t.extractfile("manifest.json"))
        stations = station_index(json.loads(gzip.decompress(t.extractfile("weather.json.gz").read())))
        items = []
        for it in meta["items"]:
            lab = label(it, stations)
            st = coords.get(it.get("weatherStation"))
            try:
                ir = is_ir(t.extractfile(f"images/{it['preset']}.jpg").read())
            except (KeyError, OSError):
                ir = None
            items.append({
                "camera": it["camera"],
                "preset": it["preset"],
                "surface": bool(it.get("surfaceView")),
                "station": it.get("weatherStation"),
                "km": round(km(it["lat"], it["lon"], st[1], st[0]), 1) if st else None,
                "imageTime": it.get("measuredTime"),
                "class": lab["class"],
                "reason": lab["reason"],
                "thin": bool(lab.get("thin")),
                "friction": lab.get("friction"),
                "ice_mm": lab.get("ice_mm"),
                "snow_mm": lab.get("snow_mm"),
                "road_temp": lab.get("road_temp"),
                "ir": ir,
            })
    return {"v": SUMMARY_VERSION, "run": meta.get("run"), "kind": meta.get("kind", "vanha ajo"),
            "format": meta.get("format", 1), "items": items}


def write_summary(tar_path: Path, coords: dict) -> Path:
    out = tar_path.with_name(tar_path.stem + ".labels.json")
    out.write_text(json.dumps(summarize(tar_path, coords), ensure_ascii=False, separators=(",", ":")))
    return out


def station_coords() -> dict[int, tuple[float, float]]:
    """{asema_id: (lon, lat)} – sama välimuisti kuin keräimellä (v2-rajapinta).
    Tuonti funktion sisällä, koska collect tuo tämän moduulin (ei kehäviittausta latausvaiheessa)."""
    from collect import weather_stations
    return {s["id"]: (s["lon"], s["lat"]) for s in weather_stations()}


if __name__ == "__main__":
    s = summarize(Path(sys.argv[1]), station_coords())
    print(json.dumps({k: v for k, v in s.items() if k != "items"}, ensure_ascii=False), len(s["items"]), "kuvaa")
    print(json.dumps(s["items"][:2], ensure_ascii=False, indent=1))
