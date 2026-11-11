"""Hajota käyttöliittymä: karttasivu pahimman tapauksen datalla.

  python tools/break_ui.py            # rakentaa out/break-ui/<skenaario>/ (kopio site/:sta + muokattu data)
  cd out/break-ui && python3 -m http.server 8766
  → http://localhost:8766/<skenaario>/

Skenaariot (data perustuu tämänhetkiseen site/data/:aan, joten sijainnit ovat oikeita):
  pitkat   ylipitkät nimet, kunnat ja varoitustekstit, suuret tienumerot, puuttuvia arvoja,
           30 varoitusta, satoja liukastuvia kameroita
  tyhja    ei yhtään mittausta, ei historiaa, ei varoituksia
  jaa      kaikki mitatut kamerat jäässä koko vuorokauden
  rikki    kuvat 404 (kuvapalvelin ja historia eivät vastaa)
"""
from __future__ import annotations

import copy
import json
import random
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "out" / "break-ui"

LONG_FI = "Valtatie 8 Mustasaari–Vöyri eritasoliittymän pohjoispuolinen levähdysalue ja rampin alkupää"
LONG_EN = "Highway 8 Mustasaari–Vöyri northern rest area beyond the grade-separated interchange and ramp start"
LONG_MUN = "Länsi-Turunmaa (Pargas–Väståboland), Saaristomeren kansallispuiston reuna-alue"
LONG_WARN_FI = ("Liikennesää: Huonon ajokelin todennäköisyys on 60 % torstaiaamusta perjantai-iltaan lumi- ja räntäsateen, "
                "jäätävän tihkun, kuuran ja voimakkaan tuulen aiheuttaman pöllyämisen vuoksi. ") * 4
LONG_HEAD = "Oranssi liikennesää: Maan etelä-, keski- ja pohjoisosa sekä Ahvenanmaa ja saaristo, to 0.00 – pe 23.59"


def write(name: str, data: dict, warnings: dict, mutate_html=None) -> None:
    d = OUT / name
    if d.exists():
        shutil.rmtree(d)
    shutil.copytree(SITE, d)
    (d / "data" / "latest.json").write_text(json.dumps(data, ensure_ascii=False))
    (d / "data" / "warnings.json").write_text(json.dumps(warnings, ensure_ascii=False))
    if mutate_html:  # muokkaa sivun skriptiä (app.js)
        p = d / "app.js"
        p.write_text(mutate_html(p.read_text()))
    print(f"  {name}: {d.relative_to(ROOT)}")


def recount(data: dict) -> None:
    keys = ["kuiva", "kostea", "märkä", "luminen", "jää/kuura"]
    counts = {k: 0 for k in keys + ["ei mittausta"]}
    for c in data["cameras"]:
        counts[c.get("cls") or "ei mittausta"] += 1
    data["counts"] = counts


def main() -> None:
    base = json.loads((SITE / "data" / "latest.json").read_text())
    warn = json.loads((SITE / "data" / "warnings.json").read_text())
    rnd = random.Random(1)

    # pitkät nimet, puuttuvat arvot, satoja liukastuvia, 30 varoitusta
    d = copy.deepcopy(base)
    for i, c in enumerate(d["cameras"]):
        if i % 3 == 0:
            c["names"] = {"fi": LONG_FI, "sv": LONG_FI, "en": LONG_EN}
            c["name"] = LONG_FI
            c["mun"] = LONG_MUN
            c["view"] = "Tienpinta pohjoiseen, kaista 2 ja piennar (kääntyvä kamera)"
        if i % 5 == 0:
            c["road"] = 20000 + i
        if c.get("cls") and i % 4 == 0:
            for k in ("friction", "water", "snow", "ice", "roadT", "airT"):
                c[k] = None
        if c.get("h") and i % 2 == 0:  # paheneva keli: kuiva → jää
            c["h"] = [0] * 20 + [4] * 5
            c["hf"] = [0.82] * 20 + [0.11] * 5
            c["cls"] = "jää/kuura"
    recount(d)
    w = copy.deepcopy(warn)
    tmpl = w["warnings"][0] if w["warnings"] else None
    if tmpl:
        w["warnings"] = []
        for i in range(30):
            x = copy.deepcopy(tmpl)
            x["id"] = f"stress-{i}"
            x["headline"] = {"fi": LONG_HEAD, "sv": LONG_HEAD, "en": LONG_HEAD}
            x["description"] = {"fi": LONG_WARN_FI, "sv": LONG_WARN_FI, "en": LONG_WARN_FI}
            if "areaDesc" in x:
                x["areaDesc"] = {k: LONG_MUN for k in ("fi", "sv", "en")} if isinstance(x["areaDesc"], dict) else LONG_MUN
            w["warnings"].append(x)
    write("pitkat", d, w)

    # ei mitään dataa
    d = copy.deepcopy(base)
    for c in d["cameras"]:
        for k in ("cls", "friction", "water", "snow", "ice", "roadT", "airT", "mt", "st", "km"):
            c[k] = None
        c["h"] = None
        c["hf"] = None
        c["why"] = "nosensor"
    recount(d)
    write("tyhja", d, {"warnings": []})

    # kaikki jäässä
    d = copy.deepcopy(base)
    for c in d["cameras"]:
        if c.get("cls"):
            c["cls"] = "jää/kuura"
            c["friction"] = 0.09
            c["h"] = [4] * 25
            c["hf"] = [0.1] * 25
    recount(d)
    write("jaa", d, warn)

    # kuvat ja historia rikki
    d = copy.deepcopy(base)
    for c in d["cameras"]:
        c["img"] = c["img"].replace(".jpg", "-ei-ole.jpg")
    write("rikki", d, warn,
          lambda h: h.replace("https://tie.digitraffic.fi/api/weathercam", "https://tie.digitraffic.fi/api/ei-ole"))


if __name__ == "__main__":
    print("Hajota UI:")
    main()
