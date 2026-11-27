"""Esikatselu kuten GitHub Pages: tekstitiedostot gzip-pakattuina (muuten Lighthouse näyttää liian hitaan sivun).

  python tools/serve.py [portti]     # oletus 8765, kansio site/
"""
from __future__ import annotations

import gzip
import http.server
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"
COMPRESS = {".html", ".js", ".css", ".json", ".geojson", ".svg"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def log_message(self, *args) -> None:
        pass

    def do_GET(self) -> None:
        path = Path(self.translate_path(self.path))
        if path.is_dir():
            path = path / "index.html"
        if path.is_file() and path.suffix in COMPRESS and "gzip" in self.headers.get("Accept-Encoding", ""):
            body = gzip.compress(path.read_bytes())
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(str(path)))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"http://127.0.0.1:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
