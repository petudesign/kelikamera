"""Sokkotarkistuksen sivu: kuva kerrallaan, vastaus näppäimellä, tallennus heti quality/answers.json:iin.

  python quality/review.py [portti]     # oletus 8770; huonojen kuvien merkintä ruudukossa: /grid

Sivu saa otoksesta vain kuvan tunnisteen ja ottoajan, ei anturin luokkaa, ettei se ohjaa vastausta.
"""
from __future__ import annotations

import http.server
import json
import os
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERE = ROOT / "quality"
SAMPLE = HERE / "sample.json"
ANSWERS = HERE / "answers.json"
BAD = HERE / "bad_images.json"
IMAGES = ROOT / "out" / "review" / "images"
FONTS = ROOT / "site" / "vendor" / "geist"
MAX_BODY_BYTES = 1024 * 1024
_WRITE_LOCK = threading.Lock()


def load(path: Path) -> dict:
    return json.loads(path.read_text()) if path.exists() else {}


def save(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True))
    os.replace(tmp, path)


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args) -> None:
        pass

    def send(self, body: bytes, ctype: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = self.path.split("?")[0]
        if path in ("/", "/grid"):
            page = "grid.html" if path == "/grid" else "review.html"
            self.send((HERE / page).read_bytes(), "text/html; charset=utf-8")
        elif path == "/items":
            blind = [{"id": x["id"], "time": x["imageTime"]} for x in json.loads(SAMPLE.read_text())]
            self.send(json.dumps({"items": blind, "answers": load(ANSWERS), "bad": load(BAD)}).encode(),
                      "application/json")
        elif path.startswith("/images/") and (f := IMAGES / Path(path).name).is_file():
            self.send(f.read_bytes(), "image/jpeg")
        elif path.startswith("/fonts/") and (f := FONTS / Path(path).name).is_file():
            self.send(f.read_bytes(), "font/woff2")
        else:
            self.send(b"", "text/plain", 404)

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            return self.send(b"invalid content-length", "text/plain", 400)
        if length < 0 or length > MAX_BODY_BYTES:
            return self.send(b"payload too large", "text/plain", 413)
        try:
            msg = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeDecodeError):
            return self.send(b"invalid json", "text/plain", 400)
        if not isinstance(msg, dict) or not isinstance(msg.get("id"), str):
            return self.send(b"missing id", "text/plain", 400)
        if self.path == "/answer":
            path, value = ANSWERS, msg.get("answer")
        elif self.path == "/flag":
            path, value = BAD, True if msg.get("bad") else None
        else:
            return self.send(b"", "text/plain", 404)
        with _WRITE_LOCK:
            data = load(path)
            if value is None:
                data.pop(msg["id"], None)
            else:
                data[msg["id"]] = value
            save(path, data)
            done = len(data)
        self.send(json.dumps({"done": done}).encode(), "application/json")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    print(f"http://localhost:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
