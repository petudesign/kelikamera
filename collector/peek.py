"""Tarkistussivu: näyttää yhden keruuajon kuvat ja lähimmän sääaseman anturiarvot.

  python collector/peek.py                  # uusin ajo
  python collector/peek.py out/.../X.tar    # tietty ajo
Tulos: out/peek/index.html
"""
import gzip
import html
import json
import random
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SENSORS = ["TIENPINNAN_TILA_1", "OPTISEN_ANTURIN_KELI1", "KITKA1_LUKU", "TIE_1", "ILMA"]
SHORT = {"TIENPINNAN_TILA_1": "tila", "OPTISEN_ANTURIN_KELI1": "keli", "KITKA1_LUKU": "kitka",
         "TIE_1": "tie °C", "ILMA": "ilma °C"}
N = 120

tars = sorted((ROOT / "out").glob("**/*.tar"))
src = Path(sys.argv[1]) if len(sys.argv) > 1 else tars[-1]
t = tarfile.open(src)
meta = json.load(t.extractfile("manifest.json"))
weather = json.loads(gzip.decompress(t.extractfile("weather.json.gz").read()))
st = {s["id"]: {v["name"]: v["value"] for v in s.get("sensorValues", [])} for s in weather["stations"]}

out = ROOT / "out" / "peek"
(out / "img").mkdir(parents=True, exist_ok=True)
items = [i for i in meta["items"] if i["surfaceView"]]
random.seed(0)
items = random.sample(items, min(N, len(items)))

cards = []
for i in items:
    (out / "img" / f"{i['preset']}.jpg").write_bytes(t.extractfile(f"images/{i['preset']}.jpg").read())
    s = st.get(i["weatherStation"], {})
    vals = "".join(f"<span><i>{SHORT[k]}</i>{s[k]}</span>" for k in SENSORS if k in s) or "<span>ei asemadataa</span>"
    cards.append(f"""<figure><img loading=lazy src="img/{i['preset']}.jpg">
<figcaption><b>{html.escape(i['cameraName'] or '')}</b><small>{i['measuredTime'][11:16]} UTC · asema {i['weatherStation']}</small>
<div class=v>{vals}</div></figcaption></figure>""")

(out / "index.html").write_text(f"""<!doctype html><meta charset=utf-8><title>Keruu {meta['run']}</title>
<style>body{{background:#111;color:#eee;font:13px system-ui;margin:16px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
figure{{margin:0;background:#1c1c1f;border-radius:6px;overflow:hidden}}img{{width:100%;display:block;aspect-ratio:16/9;object-fit:cover}}
figcaption{{padding:8px}}small{{display:block;color:#999}}.v{{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}}
.v span{{background:#2a2a30;padding:2px 6px;border-radius:3px}}.v i{{color:#999;font-style:normal;margin-right:4px}}</style>
<h1>Keruu {meta['run']}</h1><p>{meta['images']} kuvaa, ohitettu {meta['skipped']}. Näytetään {len(items)} satunnaista tienpintakuvaa.
Lähde: {meta['source']}</p><div class=g>{''.join(cards)}</div>""")
print(out / "index.html")
