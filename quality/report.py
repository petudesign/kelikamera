"""Sokkotarkistuksen tulos: ihmisen vastaukset verrattuna anturin luokkaan.

  python quality/report.py      # tulostaa ja kirjoittaa quality/report.md

Kertoo, kuinka usein kuva ja anturi ovat samaa mieltä (luokittain sekä karkeasti talvikeli vai ei),
mitkä luokat menevät sekaisin, kuinka moni kuva on käyttökelvoton ja millä asemilla erimielisyydet toistuvat.
Ihmisen ja anturin yhtäpitävyys on samalla realistinen yläraja sille, mitä kuvasta voi oppia.
"""
from __future__ import annotations

import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERE = ROOT / "quality"
CLASSES = ["kuiva", "kostea", "märkä", "luminen", "jää/kuura"]
UNUSABLE = ["en näe", "ei tienpintaa"]
WINTER = {"luminen", "jää/kuura"}
STRATA = CLASSES + ["ohut"]


def read(x) -> dict:
    return {"answer": x, "sure": True} if isinstance(x, str) else x


def pct(n: int, d: int) -> str:
    return f"{n / d * 100:.0f} %" if d else "–"


def rows(sample: list[dict], answers: dict) -> list[dict]:
    return [{**x, **read(answers[x["id"]])} for x in sample if x["id"] in answers]


def report(r: list[dict], total: int) -> str:
    seen = [x for x in r if x["answer"] not in UNUSABLE]
    lost = ", ".join(f"{u} {sum(x['answer'] == u for x in r)}" for u in UNUSABLE)
    out = ["# Sokkotarkistus: kuva vs. anturi\n",
           f"Vastattu {len(r)}/{total} kuvaan. Käyttökelvottomia {len(r) - len(seen)} ({lost}).\n"]

    unsure = [x for x in seen if not x["sure"]]
    if unsure:
        out.append(f"Epävarmoja vastauksia {len(unsure)} ({pct(len(unsure), len(seen))}).\n")

    out.append("## Yhtäpitävyys\n")
    out.append("| | kuvia | sama luokka | talvikeli samoin* |\n|---|---:|---:|---:|")
    groups = [("kaikki", seen), ("päivä", [x for x in seen if not x["ir"]]), ("yö (IR)", [x for x in seen if x["ir"]])]
    groups += [(k, [x for x in seen if x["stratum"] == k]) for k in STRATA]
    for name, g in groups:
        exact = sum(x["answer"] == x["class"] for x in g)
        coarse = sum((x["answer"] in WINTER) == (x["class"] in WINTER) for x in g)
        out.append(f"| {name} | {len(g)} | {pct(exact, len(g))} | {pct(coarse, len(g))} |")
    out.append("\n\\* talvikeli = luminen tai jää/kuura; sama, jos kuva ja anturi ovat samaa mieltä siitä, onko talvikeli. "
               "Ohuissa kerroksissa anturin luokka on lumi tai jää, joten sarake kertoo, kuinka usein kuvassa näkyy talvikeli.\n")

    out.append("## Anturin luokka (rivi) ja vastaus (sarake)\n")
    cols = CLASSES + UNUSABLE
    out.append("| anturi \\ kuva | " + " | ".join(cols) + " |\n|---|" + "---:|" * len(cols))
    for k in STRATA:
        c = collections.Counter(x["answer"] for x in r if x["stratum"] == k)
        out.append(f"| {k} | " + " | ".join(str(c[a] or "·") for a in cols) + " |")

    out.append("\n## Asemat, joilla kuva ja anturi ovat toistuvasti eri mieltä talvikelistä\n")
    by_station = collections.defaultdict(list)
    for x in seen:
        if x["stratum"] != "ohut" and (x["answer"] in WINTER) != (x["class"] in WINTER):
            by_station[x["station"]].append(x)
    repeat = {s: xs for s, xs in by_station.items() if len(xs) >= 2}
    if repeat:
        out.append("| asema | kerrat | anturi → kuva | kuvat |\n|---|---:|---|---|")
        for s, xs in sorted(repeat.items(), key=lambda kv: -len(kv[1])):
            out.append(f"| {s} | {len(xs)} | " + ", ".join(f"{x['class']} → {x['answer']}" for x in xs) +
                       " | " + ", ".join(x["id"] for x in xs) + " |")
    else:
        out.append("Ei yhtään asemaa, jolla erimielisyys toistuisi otoksessa (yksittäisiä "
                   f"{sum(len(v) for v in by_station.values())}).")
    return "\n".join(out) + "\n"


def main() -> None:
    sample = json.loads((HERE / "sample.json").read_text())
    answers = json.loads((HERE / "answers.json").read_text()) if (HERE / "answers.json").exists() else {}
    text = report(rows(sample, answers), len(sample))
    (HERE / "report.md").write_text(text)
    print(text)


if __name__ == "__main__":
    main()
