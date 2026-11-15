"""Tarkistus: jääkö aikajana vasemman kortin tai kamerapaneelin alle eri näyttöleveyksillä.

  python tools/overlap_check.py [http://localhost:8765/?lang=fi]

Avaa sivun Chromessa ilman ikkunaa yleisillä läppäri- ja työpöytäleveyksillä, paneeli kiinni ja auki,
ja mittaa päällekkäisen alueen (px²). Exit 1, jos jokin on päällekkäin.
Syntyi, kun 1280 px:n läppärillä aikajana meni korttien alle (DECISIONS.md 2026-11-15).
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

SIZES = [(800, 900), (1024, 768), (1280, 720), (1280, 800), (1366, 768), (1440, 900), (1600, 1000), (1920, 1080)]
PORT = 9356
JS = """JSON.stringify(Object.fromEntries(['#key','#timeline','#panel'].map(s=>{const e=document.querySelector(s);
  const r=e.getBoundingClientRect(); const vis=s!=='#panel'||e.classList.contains('on');
  return [s,vis?{l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width}:null]})))"""


def overlap(a, b) -> int:
    if not a or not b:
        return 0
    x = max(0, min(a["r"], b["r"]) - max(a["l"], b["l"]))
    y = max(0, min(a["b"], b["b"]) - max(a["t"], b["t"]))
    return round(x * y)


def main(url: str) -> int:
    prof = tempfile.mkdtemp()
    proc = subprocess.Popen([S.CHROME, "--headless=new", f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}",
                             "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    bad = 0
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
        for w, h in SIZES:
            c("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=1, mobile=False)
            c("Page.navigate", url=url)
            time.sleep(6)
            for opened in (False, True):
                if opened:
                    c("Runtime.evaluate", expression="openCam(DATA.cameras.find(x=>x.cls).id)")
                    time.sleep(1.2)  # paneelin liuku ja aikajanan siirtymä
                d = json.loads(c("Runtime.evaluate", returnByValue=True, expression=JS)["result"]["value"])
                tl = d["#timeline"]
                ok, op = overlap(tl, d["#key"]), overlap(tl, d["#panel"])
                bad += bool(ok or op)
                print(f"{w}x{h} {'paneeli auki ' if opened else 'paneeli kiinni'}: aikajana {round(tl['l'])}–{round(tl['r'])} "
                      f"(lev {round(tl['w'])}) · kortti {ok} px² · paneeli {op} px²{'  ← PÄÄLLEKKÄIN' if ok or op else ''}")
    finally:
        proc.terminate()
    print("Ei päällekkäisyyksiä." if not bad else f"Päällekkäisyyksiä: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/?lang=fi"))
