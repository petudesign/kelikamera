"""Käsin tarkistettava otos: kuvat, joiden anturiluokka tarkistetaan sokkona.

  python quality/sample.py      # otos quality/sample.json ja kuvat out/review/images/ (vaatii `hf auth login`)
  python quality/review.py      # tarkistussivu, http://localhost:8770/
  python quality/report.py      # vastaukset verrattuna anturiin → quality/report.md

Otos on ositettu: PER_STRATUM kuvaa jokaisesta luokasta ja ohuista kerroksista, kukin eri kameralta, RUNS
keruuhetkestä tasaisesti koko keruun ajalta (näin ladattavaa on noin kymmenesosa datasetistä). Mukana vain
opetusdataan kelpaavat kuvat: tienpinta, luokka tiedossa, asema enintään 5 km päässä. Siemen on kiinteä ja
valmis otos säilytetään, joten sama otos kelpaa myöhemmin myös mallin testaamiseen.
"""
from __future__ import annotations

import argparse
import json
import random
import sys
import tarfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "collector"))
from count import MAX_KM, summaries_hf  # noqa: E402
from labels import CLASSES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "quality" / "sample.json"
IMAGES = ROOT / "out" / "review" / "images"
REPO = "petudesign/kelikamera"
STRATA = CLASSES + ["ohut"]
PER_STRATUM = 50
RUNS = 30
SEED = 17


def stratum(item: dict) -> str:
    return "ohut" if item["thin"] else item["class"]


def usable(item: dict) -> bool:
    return bool(item.get("surface") and item.get("class") and item.get("km") is not None and item["km"] <= MAX_KM)


def draw(sums: list[dict]) -> list[dict]:
    runs = sorted(s["run"] for s in sums)
    picked = set(runs[::max(1, len(runs) // RUNS)])
    rnd = random.Random(SEED)
    pool = {k: [] for k in STRATA}
    for s in sums:
        if s["run"] in picked:
            for i in s["items"]:
                if usable(i):
                    pool[stratum(i)].append(dict(i, run=s["run"]))
    sample = []
    for k, items in pool.items():
        rnd.shuffle(items)
        seen = set()
        for i in items:
            if i["camera"] not in seen:
                seen.add(i["camera"])
                sample.append({"id": f"{i['run']}_{i['preset']}", "stratum": k, **{f: i.get(f) for f in (
                    "run", "camera", "preset", "station", "km", "imageTime", "class", "thin", "friction",
                    "ice_mm", "snow_mm", "road_temp", "ir")}})
            if len(seen) == PER_STRATUM:
                break
    rnd.shuffle(sample)  # tarkistusjärjestys sekaisin, ettei luokka paljastu järjestyksestä
    return sample


def fetch_images(sample: list[dict]) -> None:
    from huggingface_hub import hf_hub_download
    IMAGES.mkdir(parents=True, exist_ok=True)
    by_run: dict[str, list[dict]] = {}
    for x in sample:
        if not (IMAGES / f"{x['id']}.jpg").exists():
            by_run.setdefault(x["run"], []).append(x)
    for n, (run, items) in enumerate(sorted(by_run.items()), 1):
        name = f"data/{run[:4]}/{run[4:6]}/{run[6:8]}/{run}.tar"
        path = hf_hub_download(REPO, name, repo_type="dataset", local_dir=ROOT / "out" / "hf")
        with tarfile.open(path) as t:
            for x in items:
                (IMAGES / f"{x['id']}.jpg").write_bytes(t.extractfile(f"images/{x['preset']}.jpg").read())
        print(f"  {n}/{len(by_run)} {run}: {len(items)} kuvaa")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--redraw", action="store_true", help="arvo uusi otos (vanhat vastaukset eivät enää täsmää)")
    args = ap.parse_args()
    if SAMPLE.exists() and not args.redraw:
        sample = json.loads(SAMPLE.read_text())
    else:
        sample = draw(summaries_hf())
        SAMPLE.write_text(json.dumps(sample, ensure_ascii=False, indent=1))
    counts = {k: sum(x["stratum"] == k for x in sample) for k in STRATA}
    print(f"Otos: {len(sample)} kuvaa {counts}")
    fetch_images(sample)
    print(f"Kuvat: {IMAGES.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
