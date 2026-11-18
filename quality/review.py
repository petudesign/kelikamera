"""Sokkotarkistuksen sivu: kuva kerrallaan, vastaus näppäimellä, tallennus heti quality/answers.json:iin.

  python quality/review.py [portti]     # oletus 8770

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
IMAGES = ROOT / "out" / "review" / "images"
FONTS = ROOT / "site" / "vendor" / "geist"


def answers() -> dict:
    return json.loads(ANSWERS.read_text()) if ANSWERS.exists() else {}


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
        if path == "/":
            self.send((HERE / "review.html").read_bytes(), "text/html; charset=utf-8")
        elif path == "/items":
            blind = [{"id": x["id"], "time": x["imageTime"]} for x in json.loads(SAMPLE.read_text())]
            self.send(json.dumps({"items": blind, "answers": answers()}).encode(), "application/json")
        elif path.startswith("/images/") and (f := IMAGES / Path(path).name).is_file():
            self.send(f.read_bytes(), "image/jpeg")
        elif path.startswith("/fonts/") and (f := FONTS / Path(path).name).is_file():
            self.send(f.read_bytes(), "font/woff2")
        else:
            self.send(b"", "text/plain", 404)

    def do_POST(self) -> None:
        if self.path != "/answer":
            return self.send(b"", "text/plain", 404)
        msg = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        a = answers()
        if msg.get("answer") is None:
            a.pop(msg["id"], None)
        else:
            a[msg["id"]] = msg["answer"]
        ANSWERS.write_text(json.dumps(a, ensure_ascii=False, indent=1, sort_keys=True))
        self.send(json.dumps({"done": len(a)}).encode(), "application/json")


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    print(f"http://localhost:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
