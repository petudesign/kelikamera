"""Tarkistus: jääkö aikajana vasemman kortin tai kamerapaneelin alle eri näyttöleveyksillä.

  python tools/overlap_check.py [url]

Mittaa päällekkäisen alueen (px²) yleisillä leveyksillä, paneeli kiinni ja auki. Exit 1, jos jokin on
päällekkäin (DECISIONS.md 2026-11-15).
"""
from __future__ import annotations

import sys
import time

from chrome import Chrome

SIZES = [(800, 900), (1024, 768), (1280, 720), (1280, 800), (1366, 768), (1440, 900), (1600, 1000), (1920, 1080)]
RECTS = """Object.fromEntries(['#key','#timeline','#panel'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();
  return [s,s!=='#panel'||e.classList.contains('on')?{l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width}:null]}))"""


def overlap(a, b) -> int:
    if not a or not b:
        return 0
    return round(max(0, min(a["r"], b["r"]) - max(a["l"], b["l"])) * max(0, min(a["b"], b["b"]) - max(a["t"], b["t"])))


def main(url: str) -> int:
    bad = 0
    with Chrome() as c:
        for w, h in SIZES:
            c.resize(w, h)
            c.open(url)
            for opened in (False, True):
                if opened:
                    c.eval("openCam(DATA.cameras.find(x=>x.cls).id)")
                    time.sleep(1.2)  # paneelin liuku ja aikajanan siirtymä
                d = c.eval(RECTS)
                tl, ok, op = d["#timeline"], overlap(d["#timeline"], d["#key"]), overlap(d["#timeline"], d["#panel"])
                bad += bool(ok or op)
                print(f"{w}x{h} {'paneeli auki ' if opened else 'paneeli kiinni'}: aikajana {round(tl['l'])}–{round(tl['r'])} "
                      f"· kortti {ok} px² · paneeli {op} px²{'  ← PÄÄLLEKKÄIN' if ok or op else ''}")
    print("Ei päällekkäisyyksiä." if not bad else f"Päällekkäisyyksiä: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/?lang=fi"))
