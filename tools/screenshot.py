"""Kuvakaappaukset karttasivusta, aina samalla tavalla otettuna.

  python tools/screenshot.py <url> <kansio> [js] [etuliite]

Kuvat: kartta-desktop.png (1600×1000 @2x) ja kartta-mobiili.png (390×844 @3x); SHOT_NARROW=1 lisää
kartta-kapea.png (320×640). Valinnainen JS ajetaan ennen kuvaa (esim. paneelin avaus), SHOT_WAIT sekunteina.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from chrome import Chrome

VIEWS = {"kartta-desktop.png": (1600, 1000, 2, False), "kartta-mobiili.png": (390, 844, 3, True)}
if os.environ.get("SHOT_NARROW"):
    VIEWS["kartta-kapea.png"] = (320, 640, 2, True)


def main(url: str, out_dir: Path, setup_js: str | None = None, prefix: str = "") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    with Chrome() as c:
        for name, size in VIEWS.items():
            c.resize(*size)
            ready = c.open(url)
            if setup_js:
                c.eval(setup_js)
            time.sleep(float(os.environ.get("SHOT_WAIT", "1.5")))
            c.screenshot(out_dir / (prefix + name))
            errors = c.errors()
            print(f"{prefix}{name}: {'ok' if ready else 'AIKAKATKAISU (kuva voi olla keskeneräinen)'}"
                  + (f" · JS-virheet: {' | '.join(errors)}" if errors else ""))


if __name__ == "__main__":
    main(sys.argv[1], Path(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else None,
         sys.argv[4] if len(sys.argv) > 4 else "")
