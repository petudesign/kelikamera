"""Edistymiskuvat karttasivusta, aina samalla tavalla otettuna.

  python tools/screenshot.py <url> <kansio>

Ottaa kaksi kuvaa: kartta-desktop.png (1600×1000 @2x) ja kartta-mobiili.png (390×844 @3x).
Valinnaisesti: JS-komento ajetaan ennen kuvaa (esim. paneelin avaus) ja tiedostonimen etuliite.
Käyttää Chromea ilman ikkunaa ja odottaa, että kartta ja karttaruudut ovat latautuneet.
Tarvitsee: pip install -r requirements-dev.txt
"""
from __future__ import annotations

import base64
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import websocket  # websocket-client

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9333
VIEWS = {
    "kartta-desktop.png": (1600, 1000, 2, False),
    "kartta-mobiili.png": (390, 844, 3, True),
}


class CDP:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=60)
        self.i = 0

    def __call__(self, method, **params):
        self.i += 1
        self.ws.send(json.dumps({"id": self.i, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.i:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})


def main(url: str, out_dir: Path, setup_js: str | None = None, prefix: str = "") -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    profile = tempfile.mkdtemp()
    proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={PORT}",
                             f"--user-data-dir={profile}", "--hide-scrollbars",
                             "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "about:blank"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
                ws_url = next(t["webSocketDebuggerUrl"] for t in tabs if t["type"] == "page")
                break
            except Exception:
                time.sleep(0.2)
        cdp = CDP(ws_url)
        cdp("Page.enable")
        # Kerää sivun JS-virheet, jotta rikkinäinen sivu ei mene kuvana läpi huomaamatta.
        cdp("Page.addScriptToEvaluateOnNewDocument", source=(
            "window.__errors=[];addEventListener('error',e=>__errors.push(e.message));"
            "addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));"))
        for name, (w, h, scale, mobile) in VIEWS.items():
            cdp("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=scale, mobile=mobile)
            cdp("Page.navigate", url=url)
            ready = False
            for _ in range(120):  # enintään ~60 s
                time.sleep(0.5)
                r = cdp("Runtime.evaluate", returnByValue=True, expression=(
                    "typeof map!=='undefined' && map.loaded() && map.areTilesLoaded()"
                    " && !!map.getLayer('cams') && !map.isMoving()"))
                if r.get("result", {}).get("value"):
                    ready = True
                    break
            if setup_js:
                cdp("Runtime.evaluate", expression=setup_js)
            time.sleep(1.5)  # viimeiset häivytykset ja paneelin liuku
            shot = cdp("Page.captureScreenshot", format="png")
            errors = cdp("Runtime.evaluate", returnByValue=True,
                         expression="(window.__errors||[]).join(' | ')").get("result", {}).get("value")
            (out_dir / (prefix + name)).write_bytes(base64.b64decode(shot["data"]))
            print(f"{prefix}{name}: {'ok' if ready else 'AIKAKATKAISU (kuva voi olla keskeneräinen)'}"
                  + (f" · JS-virheet: {errors}" if errors else ""))
    finally:
        proc.terminate()


if __name__ == "__main__":
    # valinnaiset: 3. argumentti = JS ajettavaksi ennen kuvaa, 4. = tiedostonimen etuliite
    main(sys.argv[1], Path(sys.argv[2]),
         sys.argv[3] if len(sys.argv) > 3 else None,
         sys.argv[4] if len(sys.argv) > 4 else "")
