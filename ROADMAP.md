# Tiekartta

Sovitut ominaisuudet ja niiden järjestys. Perustelut ovat [DECISIONS.md](DECISIONS.md):ssä, ja edistyminen
on [PROGRESS.md](PROGRESS.md):ssä.

Tila: ✅ valmis · 🔨 työn alla · ⏳ sovittu, ei aloitettu

## Perusta

| | Ominaisuus | Huom. |
|---|---|---|
| ✅ | Keruu 3 h keruuhetkistä Digitrafficin historiasta + talvitihennys (GitHub Actions → Hugging Face) | 2026-11-11 alkaen |
| ✅ | Tunnisteet optisesta kelianturista + luokkalaskuri | |
| ✅ | Karttasivu anturidatalla, rajattu Suomeen | |
| ✅ | Paneelien uusi ilme (UI v2) | |
| ✅ | Logo, vaaleammat paneelit, aikajana tuntipylväinä | |
| ✅ | Edistymisloki + lähtötason kuvat | |
| ✅ | **Sääennusteiden arkistointi keruun yhteydessä** | Pilvessä 2026-11-09 alkaen |
| ✅ | Julkaisu GitHub Pagesiin, päivittyy keruun yhteydessä | petudesign.github.io/kelikamera |
| ✅ | Siirto Digitrafficin v2-rajapintaan (v1 poistuu 2027-04-13) | |
| ✅ | Kielet: suomi ja englanti | Ruotsi myöhemmin |

## Ominaisuudet (sovittu 2026-11-09)

| | Ominaisuus | Tarvitsee mallia? | Datalähde |
|---|---|---|---|
| ✅ | **Viralliset ajokelivaroitukset** näkyviin sellaisinaan, lähde mainiten | Ei | Ilmatieteen laitos |
| ✅ | **"Liukastumassa"-lista:** kamerat, joissa keli on muuttunut huonompaan viime tunteina | Ei (malli laajentaa) | Digitrafficin 24 h historia |
| ✅ | **Tiekohtainen näkymä:** esim. vt 4 nauhana etelästä pohjoiseen, pahin kohta korostettuna | Ei (malli laajentaa) | Oma keruu + tieosoitteet |
| ✅ | **Reittihaku:** mistä–minne, reitin kamerat, liukkaat kohdat ja varoitukset yhteenvetona | Ei (malli laajentaa) | Photon + OSRM (FOSSGIS) |
| ✅ | **Aikajana:** viimeiset 24 h kelattavana | Ei | Digitrafficin 24 h historia |
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
