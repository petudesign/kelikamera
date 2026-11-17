"""Chrome ilman ikkunaa DevTools-protokollalla: yhteinen pohja selaintyökaluille (kuvat, tarkistukset)."""
from __future__ import annotations

import base64
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websocket  # websocket-client

CHROME = os.environ.get("CHROME") or next(
    (p for p in ("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                 shutil.which("google-chrome") or "", shutil.which("chromium") or "") if p and Path(p).exists()), "")

# Sivun JS-virheet talteen, jotta rikkinäinen sivu ei mene läpi huomaamatta.
CAPTURE_ERRORS = ("window.__errors=[];addEventListener('error',e=>__errors.push(e.message));"
                  "addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));")
MAP_READY = ("typeof map!=='undefined'&&map.loaded()&&map.areTilesLoaded()"
             "&&!!map.getLayer('cams')&&!map.isMoving()")


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Chrome:
    def __init__(self, width: int = 1440, height: int = 900, scale: float = 1, mobile: bool = False):
        self.size = (width, height, scale, mobile)
        self._id = 0

    def __enter__(self) -> "Chrome":
        port = _free_port()
        self.proc = subprocess.Popen(
            [CHROME, "--headless=new", f"--remote-debugging-port={port}", f"--user-data-dir={tempfile.mkdtemp()}",
             "--hide-scrollbars", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
             *(["--no-sandbox"] if os.environ.get("CI") else []),  # GitHubin Ubuntu-koneella ei hiekkalaatikkoa
             "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
                self.ws = websocket.create_connection(
                    next(t["webSocketDebuggerUrl"] for t in tabs if t["type"] == "page"), timeout=90)
                break
            except Exception:
                time.sleep(0.2)
        else:
            self.proc.terminate()
            raise RuntimeError(f"Chrome ei käynnistynyt ({CHROME or 'ei löytynyt; aseta CHROME'})")
        self.send("Page.enable")
        self.send("Page.addScriptToEvaluateOnNewDocument", source=CAPTURE_ERRORS)
        self.resize(*self.size)
        return self

    def __exit__(self, *exc) -> None:
        self.proc.terminate()

    def send(self, method: str, **params) -> dict:
        self._id += 1
        self.ws.send(json.dumps({"id": self._id, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self._id:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})

    def resize(self, width: int, height: int, scale: float = 1, mobile: bool = False) -> None:
        self.send("Emulation.setDeviceMetricsOverride", width=width, height=height,
                  deviceScaleFactor=scale, mobile=mobile)

    def eval(self, expression: str):
        r = self.send("Runtime.evaluate", expression=expression, returnByValue=True, awaitPromise=True)
        if "exceptionDetails" in r:
            raise RuntimeError(r["exceptionDetails"].get("text", "JS-virhe"))
        return r.get("result", {}).get("value")

    def open(self, url: str, settle: float = 0, timeout: float = 60) -> bool:
        """Avaa sivun ja odottaa, että kartta ja sen ruudut ovat valmiina. False = aikakatkaisu."""
        self.send("Page.navigate", url=url)
        end = time.time() + timeout
        while time.time() < end:
            time.sleep(0.5)
            if self.eval(MAP_READY):
                time.sleep(settle)
                return True
        return False

    def errors(self) -> list[str]:
        return self.eval("window.__errors||[]") or []

    def screenshot(self, path: Path, clip: dict | None = None) -> None:
        params = {"format": "png", **({"clip": {**clip, "scale": 1}} if clip else {})}
        path.write_bytes(base64.b64decode(self.send("Page.captureScreenshot", **params)["data"]))
