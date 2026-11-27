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

def main() -> None:
    tars = sorted((ROOT / "out").glob("**/*.tar"))
    if len(sys.argv) > 1:
        src = Path(sys.argv[1])
    elif tars:
        src = tars[-1]
    else:
        raise SystemExit("Ei yhtään .tar-tiedostoa out/-kansiossa")

    out = ROOT / "out" / "peek"
    (out / "img").mkdir(parents=True, exist_ok=True)
    with tarfile.open(src) as t:
        mf = t.extractfile("manifest.json")
        wf = t.extractfile("weather.json.gz")
        if mf is None or wf is None:
            raise SystemExit(f"{src.name}: manifest.json tai weather.json.gz puuttuu")
        meta = json.load(mf)
        weather = json.loads(gzip.decompress(wf.read()))
        st = {s["id"]: {v["name"]: v["value"] for v in s.get("sensorValues", [])} for s in weather["stations"]}

        items = [i for i in meta["items"] if i.get("surfaceView")]
        random.seed(0)
        items = random.sample(items, min(N, len(items)))

        cards = []
        for i in items:
            img_f = t.extractfile(f"images/{i['preset']}.jpg")
            if img_f is None:
                continue
            preset = html.escape(str(i["preset"]))
            (out / "img" / f"{i['preset']}.jpg").write_bytes(img_f.read())
            s = {k: v["value"] for k, v in i["sensors"].items()} if "sensors" in i else st.get(i["weatherStation"], {})
            vals = ("".join(f"<span><i>{html.escape(SHORT[k])}</i>{html.escape(str(s[k]))}</span>"
                            for k in SENSORS if k in s) or "<span>ei asemadataa</span>")
            cards.append(f"""<figure><img loading=lazy src="img/{preset}.jpg">
<figcaption><b>{html.escape(i.get('cameraName') or '')}</b><small>kuva {html.escape(str(i.get('measuredTime', ''))[11:16])} UTC · asema {html.escape(str(i.get('weatherStation')))}</small>
<div class=v>{vals}</div></figcaption></figure>""")

    run_txt = html.escape(str(meta.get("run", "")))
    kind_txt = f" · {html.escape(str(meta['kind']))}" if meta.get("kind") else ""
    (out / "index.html").write_text(f"""<!doctype html><meta charset=utf-8><title>Keruu {run_txt}</title>
<style>body{{background:#111;color:#eee;font:13px system-ui;margin:16px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
figure{{margin:0;background:#1c1c1f;border-radius:6px;overflow:hidden}}img{{width:100%;display:block;aspect-ratio:16/9;object-fit:cover}}
figcaption{{padding:8px}}small{{display:block;color:#999}}.v{{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}}
.v span{{background:#2a2a30;padding:2px 6px;border-radius:3px}}.v i{{color:#999;font-style:normal;margin-right:4px}}</style>
<h1>Keruu {run_txt}{kind_txt}</h1><p>{html.escape(str(meta.get('images')))} kuvaa, ohitettu {html.escape(str(meta.get('skipped')))}. Näytetään {len(cards)} satunnaista tienpintakuvaa.
Lähde: {html.escape(str(meta.get('source', '')))}</p><div class=g>{''.join(cards)}</div>""")
    print(out / "index.html")


if __name__ == "__main__":
    main()
