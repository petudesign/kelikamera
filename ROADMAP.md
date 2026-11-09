# Tiekartta

Sovitut ominaisuudet ja niiden järjestys. Perustelut ovat [DECISIONS.md](DECISIONS.md):ssä, ja edistyminen
on [PROGRESS.md](PROGRESS.md):ssä.

Tila: ✅ valmis · 🔨 työn alla · ⏳ sovittu, ei aloitettu

## Perusta

| | Ominaisuus | Huom. |
|---|---|---|
| ✅ | Keruu 3 h välein (GitHub Actions → Hugging Face) | |
| ✅ | Tunnisteet optisesta kelianturista + luokkalaskuri | |
| ✅ | Karttasivu anturidatalla, rajattu Suomeen | Vain paikallisesti |
| ✅ | Edistymisloki + lähtötason kuvat | |
| ⏳ | **Sääennusteiden arkistointi keruun yhteydessä** | Aikakriittinen: 3 päivän arvion kouluttaminen vaatii, että tiedetään, mitä ennuste sanoi silloin |
| ⏳ | Julkaisu GitHub Pagesiin, päivittyy keruun yhteydessä | |

## Ominaisuudet (sovittu 2026-11-09)

| | Ominaisuus | Tarvitsee mallia? | Datalähde |
|---|---|---|---|
| ⏳ | **Viralliset ajokelivaroitukset** näkyviin sellaisinaan, lähde mainiten | Ei | Ilmatieteen laitos |
| ⏳ | **"Liukastumassa"-lista:** kamerat, joissa keli on muuttunut huonompaan viime tunteina | Ei (malli laajentaa) | Oma keruu |
| ⏳ | **Tiekohtainen näkymä:** esim. vt 4 nauhana etelästä pohjoiseen, pahin kohta korostettuna | Ei (malli laajentaa) | Oma keruu |
| ⏳ | **Aikajana:** viimeiset 24 h kelattavana | Ei | Oma keruu |
| ⏳ | **Tekoälyarvio** harmaille kameroille | Kyllä | Malli |
| ⏳ | **"Mitä malli katsoi"** -lämpökartta kuvan päällä | Kyllä | Malli |
| ⏳ | **3 päivän liukkausriski** tieosuuksittain | Oma ennustemalli | Ilmatieteen laitos (ECMWF + muokattu ennuste) + oma keruu |
| ⏳ | **Tien seuraaminen:** ilmoitus, kun valittu tie liukastuu | Ei | Vaatii ilmoituskanavan (esim. Telegram-botti) |
| ⏳ | **"Arvaa keli" -peli** | Hyötyy mallista | Oma keruu |

## Periaatteet

- **Omat arviot eivät näytä virallisilta varoituksilta.** Viralliset varoitukset näytetään erikseen ja lähde mainiten.
  Oma lisäarvo esitetään tietona tai riskinä, ei varoituksena.
- **Mitattu ja arvioitu erottuvat aina** (täytetty piste vs. rengas, varmuusprosentti näkyvissä).
- **Kattavuus esitetään aina yhdessä tarkkuuden kanssa.**
