# Kelikamera AI

**Sivu:** https://petudesign.github.io/kelikamera/ (päivittyy tunnin välein; kuvat kiinteiltä keruuhetkiltä 3 h välein, talvella tihennettynä)

Tavoite: arvioida tien pinnan tila ja kitka Fintraffic-kelikameroiden kuvista. Opetusdata syntyy
automaattisesti, kun jokainen kuva yhdistetään lähimmän tiesääaseman anturimittaukseen samalta hetkeltä.

Vaihe nyt: **datan keruu talvelta 2026–27.** Päätökset ja niiden perustelut: [DECISIONS.md](DECISIONS.md).
Edistyminen mittareina ja kuvina: [PROGRESS.md](PROGRESS.md). Sovitut ominaisuudet: [ROADMAP.md](ROADMAP.md).

## Rakenne

```
collector/                     keruu ja tunnisteet (Python)
  collect.py                   keräin: puuttuvat keruuhetket Digitrafficin historiasta, yksi hetki = yksi tar
  digitraffic.py               Digitrafficin rajapinnat: kamerat, kuvat, asemat ja niiden 24 h historia
  forecasts.py                 sääennusteet arkistoon (Digitraffic, Ilmatieteen laitos)
  slots.py                     keruuhetket ja aikasarjojen haku (puhtaat funktiot)
  storage.py                   tallennus: out/ ja Hugging Face
  labels.py                    tunniste: kuva → keliluokka ja kitka lähimmästä tiesääasemasta
  summary.py                   tunnisteyhteenveto keruutiedostosta (<hetki>.labels.json)
  count.py                     opetusdatan valmius tunnisteyhteenvedoista (--hf: ei kuvia)
  backfill_labels.py           puuttuvat yhteenvedot vanhoille ajoille
  build_site.py                karttasivun data → site/data/
  peek.py                      tarkistussivu yhden keruutiedoston kuvista ja anturiarvoista
site/                          karttasivu (staattinen, ei kehystä, suomi/englanti)
  index.html                   rakenne ja tyylit
  js/                          i18n, core, map, sidebar, route, timeline, camera-image, panel, main
  vendor/                      Geist-fontti ja MapLibre omasta reposta (ei kolmansia osapuolia)
tests/                         yksikkötestit (pytest)
tools/                         selaintarkistukset ja kuvat (Chrome ilman ikkunaa, tools/chrome.py)
  serve.py                     esikatselu pakattuna kuten GitHub Pages (suorituskykymittauksiin)
  smoke_test.py                päätoiminnot: kamera, aikajana, kieli, varoitukset, haku, JS-virheet
  overlap_check.py             aikajana ei korttien alla leveyksillä 800–1920 px
  external_hosts.py            vain sallitut ulkoiset palvelimet (kenelle kävijän IP menee)
  screenshot.py                kuvakaappaukset (työpöytä, puhelin, kapea puhelin)
  break_ui.py                  sivu pahimman tapauksen datalla
.github/workflows/
  collect.yml                  keruu ja julkaisu tunnin välein, aukkojen valvonta
  labels.yml                   opetusdatan valmius päivittäin
  ci.yml                       testit ja selaintarkistukset jokaisessa pushissa
```

## Paikallinen ajo

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -r requirements-dev.txt
.venv/bin/python -m pytest -q tests                  # yksikkötestit
.venv/bin/python collector/collect.py --dry-run      # mitä keräin hakisi
.venv/bin/python collector/collect.py --limit 30     # pikatesti
.venv/bin/python collector/build_site.py             # sivun data
.venv/bin/python tools/serve.py &                    # esikatselu http://localhost:8765/, sitten esim.
.venv/bin/python tools/smoke_test.py
```

Ilman `HF_TOKEN`- ja `HF_REPO`-ympäristömuuttujia tiedostot jäävät vain `out/`-kansioon.

## Käyttöönotto GitHubissa

1. Repon *Settings → Secrets and variables → Actions*:
   - **Secrets** → `HF_TOKEN` = Hugging Facen write-token
   - **Variables** → `HF_REPO` = esim. `käyttäjänimi/kelikamera` (datasetti luodaan yksityisenä, jos sitä ei ole)
2. *Actions → Keruu → Run workflow* käynnistää ensimmäisen ajon käsin. Sen jälkeen ajo toistuu tunnin välein.

## Lähde ja lisenssi

Kuvat, anturidata ja tiesääennusteet: Fintraffic / [digitraffic.fi](https://www.digitraffic.fi/), CC BY 4.0.
Sääennusteet ja liikennesäävaroitukset: [Ilmatieteen laitos](https://www.ilmatieteenlaitos.fi/avoin-data), CC BY 4.0.
Kartta: OpenFreeMap, © OpenMapTiles, © OpenStreetMap. Paikkahaku: Photon (komoot). Reititys: OSRM (FOSSGIS).
