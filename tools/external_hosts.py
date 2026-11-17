"""Tarkistus: mihin ulkoisiin palvelimiin sivu ottaa yhteyttä (= kenelle kävijän IP-osoite menee).

  python tools/external_hosts.py [url]

Avaa sivun ja yhden kameran ja listaa palvelimet, joilta selain haki jotain. Exit 1, jos mukana on
palvelin, jota ei ole sallittu (DECISIONS.md 2026-11-13: fontti ja karttakirjasto ladattiin Googlelta ja CDN:stä).
"""
from __future__ import annotations

import sys
import time
from urllib.parse import urlparse

from chrome import Chrome

ALLOWED = {
    "tiles.openfreemap.org",      # karttaruudut ja kartan fontit
    "weathercam.digitraffic.fi",  # kamerakuvat (Fintraffic)
    "tie.digitraffic.fi",         # kameran ottoaika ja kuvahistoria (Fintraffic)
}
HOSTS = "[...new Set(performance.getEntriesByType('resource').map(e=>new URL(e.name).host))]"


def main(url: str) -> int:
    with Chrome() as c:
        c.open(url)
        c.eval("openCam(DATA.cameras.find(x=>x.cls).id)")
        time.sleep(4)
        hosts = [h for h in c.eval(HOSTS) if h != urlparse(url).netloc]
    bad = [h for h in hosts if h not in ALLOWED]
    for h in hosts:
        print(f"  {'OK ' if h in ALLOWED else 'EI SALLITTU'}  {h}")
    print("Kaikki ulkoiset yhteydet sallittuja." if not bad else f"Ei sallittuja: {', '.join(bad)}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/?lang=fi"))
