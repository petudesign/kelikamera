"""Luokkalaskuri: montako käyttökelpoista esimerkkiä kustakin kelistä on kertynyt.

  python collector/count.py              # paikalliset ajot (out/), yhteenveto lasketaan tarvittaessa
  python collector/count.py --hf         # vain tunnisteyhteenvedot Hugging Facesta (ei kuvia; vaatii HF_TOKEN
                                         # tai `hf auth login`)
  python collector/count.py --hf --md    # sama Markdown-taulukkona (Actionsin yhteenvetoon)

Laskee jokaisen keruuhetken tunnisteyhteenvedosta (<hetki>.labels.json, ks. summary.py), ei kuvista.
Käyttökelpoinen esimerkki = tienpintakulma, luokka tiedossa, ei ohut kerros, asema enintään MAX_KM päässä.
Kertoo per luokka: kuvat, eri kamerat (tärkeämpi kuin kuvamäärä), yökuvat (IR), mediaanikitkan ja
ohuet kerrokset erikseen. Lisäksi hylkäyssyyt. Tulos myös tiedostoon out/counts.json.
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from labels import CLASSES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
READY_CAMERAS = 30  # "valmis" = näin monta eri kameraa luokassa
MAX_KM = 5.0        # sama raja kuin kartalla: kauempana olevan aseman mittaus ei kerro kameran kelistä


def summaries_local() -> list[dict]:
    """Paikalliset ajot: valmis .labels.json, tai lasketaan tar-tiedostosta (ja tallennetaan)."""
    from digitraffic import station_coords
    from summary import write_summary
    tars = sorted({p.name: p for p in OUT.glob("**/*.tar") if "hf" not in p.parts}.values())
    coords = None
    out = []
    for t in tars:
        lj = t.with_name(t.stem + ".labels.json")
        if not lj.exists():
            coords = coords or station_coords()
            write_summary(t, coords)
        out.append(json.loads(lj.read_text()))
    return out


def summaries_hf() -> list[dict]:
    """Vain yhteenvedot Hugging Facesta (muutama kt per keruuhetki)."""
    from huggingface_hub import snapshot_download
    repo = os.environ.get("HF_REPO", "petudesign/kelikamera")
    d = Path(snapshot_download(repo, repo_type="dataset", allow_patterns="data/**/*.labels.json",
                               local_dir=OUT / "hf", token=os.environ.get("HF_TOKEN")))
    return [json.loads(p.read_text()) for p in sorted(d.glob("data/**/*.labels.json"))]


def count(sums: list[dict]) -> dict:
    per = {c: {"images": 0, "cameras": set(), "night": 0, "friction": [], "thin": 0, "thin_cams": set()} for c in CLASSES}
    reasons = collections.Counter()
    kinds = collections.Counter(s.get("kind", "vanha ajo") for s in sums)
    surface = 0
    for s in sums:
        for it in s["items"]:
            if not it.get("surface"):
                reasons["ei tienpintakulma"] += 1
                continue
            surface += 1
            if it.get("km") is not None and it["km"] > MAX_KM:
                reasons[f"asema yli {MAX_KM:g} km"] += 1
                continue
            if it.get("class") is None:
                reasons[it.get("reason") or "ei luokkaa"] += 1
                continue
            c = per[it["class"]]
            if it.get("thin"):
                c["thin"] += 1
                c["thin_cams"].add(it["camera"])
                continue
            c["images"] += 1
            c["cameras"].add(it["camera"])
            c["night"] += bool(it.get("ir"))
            if it.get("friction") is not None:
                c["friction"].append(it["friction"])
    classes = {}
    for cls in CLASSES:
        c = per[cls]
        classes[cls] = {"images": c["images"], "cameras": len(c["cameras"]), "night": c["night"],
                        "friction_median": statistics.median(c["friction"]) if c["friction"] else None,
                        "ready": len(c["cameras"]) >= READY_CAMERAS,
                        "thin_images": c["thin"], "thin_cameras": len(c["thin_cams"])}
    return {"runs": len(sums), "kinds": dict(kinds), "surface_images": surface,
            "classes": classes, "rejected": dict(reasons.most_common())}


def show(r: dict, md: bool) -> None:
    kinds = ", ".join(f"{k} {n}" for k, n in sorted(r["kinds"].items()))
    if md:
        print(f"### Opetusdatan valmius\n\nKeruuhetkiä {r['runs']} ({kinds}) · tienpintakuvia {r['surface_images']} · "
              f"raja {READY_CAMERAS} eri kameraa per luokka, asema ≤ {MAX_KM:g} km\n")
        print("| Luokka | Kuvia | Eri kameroita | Yökuvia | Kitka (med.) | Valmis | Ohut kerros (pois) |")
        print("|---|---:|---:|---:|---:|:---:|---:|")
        for cls, c in r["classes"].items():
            fr = f"{c['friction_median']:.2f}" if c["friction_median"] is not None else "–"
            thin = f"{c['thin_images']} / {c['thin_cameras']} kam." if c["thin_images"] else ""
            print(f"| {cls} | {c['images']} | {c['cameras']} | {c['night']} | {fr} | {'✓' if c['ready'] else '–'} | {thin} |")
        print("\nHylätyt: " + ", ".join(f"{k} {n}" for k, n in r["rejected"].items()))
        return
    print(f"Keruuhetkiä: {r['runs']} ({kinds}) · tienpintakuvia: {r['surface_images']}\n")
    print(f"{'luokka':<11}{'kuvia':>7}{'kameroita':>11}{'yö (IR)':>9}{'kitka med.':>12}  valmis?   ohut kerros (pois)")
    for cls, c in r["classes"].items():
        fr = f"{c['friction_median']:.2f}" if c["friction_median"] is not None else "–"
        print(f"{cls:<11}{c['images']:>7}{c['cameras']:>11}{c['night']:>9}{fr:>12}  {'✓' if c['ready'] else '–'}"
              + (f"         {c['thin_images']} kuvaa / {c['thin_cameras']} kameraa" if c["thin_images"] else ""))
    print("\nHylätyt:")
    for k, n in r["rejected"].items():
        print(f"  {n:>6}  {k}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hf", action="store_true", help="tunnisteyhteenvedot Hugging Facesta (ei kuvia)")
    ap.add_argument("--md", action="store_true", help="tulostus Markdown-taulukkona")
    args = ap.parse_args()
    r = count(summaries_hf() if args.hf else summaries_local())
    show(r, args.md)
    OUT.mkdir(exist_ok=True)
    (OUT / "counts.json").write_text(json.dumps(r, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
