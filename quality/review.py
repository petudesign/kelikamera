"""Sokkotarkistuksen sivu: kuva kerrallaan, vastaus näppäimellä, tallennus heti quality/answers.json:iin.

  python quality/review.py [portti]     # oletus 8770; huonojen kuvien merkintä ruudukossa: /grid

Sivu saa otoksesta vain kuvan tunnisteen ja ottoajan, ei anturin luokkaa, ettei se ohjaa vastausta.
"""
from __future__ import annotations

import http.server
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERE = ROOT / "quality"
SAMPLE = HERE / "sample.json"
ANSWERS = HERE / "answers.json"
BAD = HERE / "bad_images.json"
IMAGES = ROOT / "out" / "review" / "images"
FONTS = ROOT / "site" / "vendor" / "geist"


def load(path: Path) -> dict:
    return json.loads(path.read_text()) if path.exists() else {}


def save(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True))


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
        msg = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if self.path == "/answer":
            path, value = ANSWERS, msg.get("answer")
        elif self.path == "/flag":
            path, value = BAD, True if msg.get("bad") else None
        else:
            return self.send(b"", "text/plain", 404)
        data = load(path)
        if value is None:
            data.pop(msg["id"], None)
        else:
            data[msg["id"]] = value
        save(path, data)
        self.send(json.dumps({"done": len(data)}).encode(), "application/json")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    print(f"http://localhost:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
