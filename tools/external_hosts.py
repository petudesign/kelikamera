"""Tarkistus: mihin ulkoisiin palvelimiin sivu ottaa yhteyttä (= kenelle kävijän IP-osoite menee).

  python tools/external_hosts.py http://localhost:8765/?lang=fi

Avaa sivun Chromessa ilman ikkunaa, odottaa latauksen, avaa yhden kameran ja listaa kaikki palvelimet,
joilta selain haki jotain. Exit 1, jos mukana on palvelin, jota ei ole sallittu (ALLOWED).
Syntyi, kun huomattiin, että fontti ja karttakirjasto ladattiin Googlelta ja unpkg:sta (DECISIONS.md 2026-11-13).
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import screenshot as S  # noqa: E402

ALLOWED = {
    "tiles.openfreemap.org",          # karttaruudut ja kartan fontit (kartan toiminta)
    "weathercam.digitraffic.fi",      # kamerakuvat (Fintraffic)
    "tie.digitraffic.fi",             # kameran ottoaika ja kuvahistoria (Fintraffic)
}
PORT = 9355


def main(url: str) -> int:
    prof = tempfile.mkdtemp()
    proc = subprocess.Popen([S.CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}",
                             "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
                ws = next(t["webSocketDebuggerUrl"] for t in tabs if t["type"] == "page")
                break
            except Exception:
                time.sleep(0.2)
        c = S.CDP(ws)
        c("Page.enable")
        c("Page.navigate", url=url)
        time.sleep(8)
        c("Runtime.evaluate", expression="openCam(DATA.cameras.find(x=>x.cls).id)")
        time.sleep(4)
        r = c("Runtime.evaluate", returnByValue=True, expression=(
            "JSON.stringify([...new Set(performance.getEntriesByType('resource').map(e=>new URL(e.name).host))])"))
        own = urllib.request.urlparse(url).netloc
        hosts = [h for h in json.loads(r["result"]["value"]) if h != own]
    finally:
        proc.terminate()
    bad = [h for h in hosts if h not in ALLOWED]
    for h in hosts:
        print(f"  {'OK ' if h in ALLOWED else 'EI SALLITTU'}  {h}")
    print("Kaikki ulkoiset yhteydet sallittuja." if not bad else f"Ei sallittuja: {', '.join(bad)}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/?lang=fi"))
