# Kelikamera AI

**Sivu:** https://petudesign.github.io/kelikamera/ (päivittyy tunnin välein, kuvat kerätään ~3 h välein)

Tavoite: arvioida tien pinnan tila ja kitka Fintraffic-kelikameroiden kuvista. Opetusdata syntyy
automaattisesti, kun jokainen kuva yhdistetään lähimmän tiesääaseman anturimittaukseen samalta hetkeltä.

Vaihe nyt: **datan keruu talvelta 2026–27.** Päätökset ja niiden perustelut: [DECISIONS.md](DECISIONS.md).
Edistyminen mittareina ja kuvina: [PROGRESS.md](PROGRESS.md). Sovitut ominaisuudet: [ROADMAP.md](ROADMAP.md).

## Rakenne

```
collector/collect.py   keräin: yksi ajo = yksi tar (kuvat, anturit, tie- ja sääennusteet)
collector/labels.py    tunnisteet: kuva → keliluokka ja kitka lähimmästä sääasemasta
collector/count.py     luokkalaskuri: montako esimerkkiä kustakin kelistä on kertynyt
collector/build_site.py karttasivun data → site/data/ (nykytila, 24 h historia, liikennesäävaroitukset)
site/                  karttasivu (staattinen, MapLibre, suomi/englanti)
tools/screenshot.py    edistymiskuvat karttasivusta (Chrome ilman ikkunaa)
collector/peek.py      tarkistussivu yhden ajon kuvista ja anturiarvoista → out/peek/index.html
.github/workflows/     ajastus GitHub Actionsissa (tunnin välein; keruu jos edellisestä > 2,5 h)
```

## Paikallinen ajo

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python collector/collect.py --limit 30   # pikatesti
.venv/bin/python collector/collect.py              # kaikki kamerat (~40 Mt, ~30 s)
.venv/bin/python collector/peek.py
```

Ilman `HF_TOKEN`- ja `HF_REPO`-ympäristömuuttujia tiedostot jäävät vain `out/`-kansioon.

## Käyttöönotto GitHubissa

1. Repon *Settings → Secrets and variables → Actions*:
   - **Secrets** → `HF_TOKEN` = Hugging Facen write-token
   - **Variables** → `HF_REPO` = esim. `käyttäjänimi/kelikamera` (datasetti luodaan yksityisenä, jos sitä ei ole)
2. *Actions → Keruu → Run workflow* käynnistää ensimmäisen ajon käsin. Sen jälkeen ajo toistuu 3 tunnin välein.

## Lähde ja lisenssi

Kuvat, anturidata ja tiesääennusteet: Fintraffic / [digitraffic.fi](https://www.digitraffic.fi/), CC BY 4.0.
Sääennusteet ja liikennesäävaroitukset: [Ilmatieteen laitos](https://www.ilmatieteenlaitos.fi/avoin-data), CC BY 4.0.
Kartta: OpenFreeMap, © OpenMapTiles, © OpenStreetMap. Paikkahaku: Photon (komoot). Reititys: OSRM (FOSSGIS).
