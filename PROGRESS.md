# Edistyminen

Mitataan samoilla mittareilla koko projektin ajan, jotta lopussa voidaan näyttää konkreettisesti,
mitä tekoäly toi lisää. Kuvat otetaan aina samalla tavalla: `python tools/screenshot.py <url> docs/progress/<pvm>`.

## Mittarit

| Mittari | Mitä se kertoo |
|---|---|
| **Kameroita kartalla** | Kuinka monta kelikameraa oli toiminnassa ajohetkellä |
| **Mitattu keli** | Kamerat, joilla on optinen kelianturi alle 5 km päässä |
| **Tekoälyn arvio** | Kamerat, joille keli on vain mallin arvio kuvasta |
| **Ei tietoa** | Kamerat, joista ei ole kumpaakaan |
| **Mallin tarkkuus** | Testijoukossa, *kameroilla joita malli ei ole nähnyt*: kuinka moni liukas tie tunnistetaan (recall) ja kuinka usein "liukas"-hälytys on aiheellinen (precision) |

**Tärkeä sääntö väitteille:** kattavuusluku ei yksin todista mitään, koska malli, joka arvaa kaikkialle
"kuiva", nostaisi kattavuuden sataan prosenttiin. Kattavuus esitetään aina yhdessä tarkkuuden kanssa.
Esimerkki kestävästä otsikosta: *"Kelitieto 797 kameralle 323:n sijaan, ja liukas tie tunnistetaan X %:n
tarkkuudella kameroilla, joita malli ei ole koskaan nähnyt."*

## Lokikirja

### 2026-11-09 · Lähtötaso (ei mallia)

| Kameroita | Mitattu keli | Tekoälyn arvio | Ei tietoa | Mallin tarkkuus |
|---:|---:|---:|---:|---|
| 797 | 323 (40,5 %) | 0 | 474 (59,5 %) | – |

Kartta ennen tekoälyä: kuusi kymmenestä kamerasta ilman kelitietoa.

![Kartta, työpöytä](docs/progress/2026-11-09/kartta-desktop.png)

<img src="docs/progress/2026-11-09/kartta-mobiili.png" width="300" alt="Kartta, mobiili">

Huom: marraskuun alku, joten talviluokkia ei juuri ole (jää/kuura 1, luminen 3 kameraa).
Ajo 2026-11-09 klo 16:02 UTC.

**Saman päivän UI-kierros (v2):** paneelit uusittiin mittaristomaisiksi (ks. DECISIONS.md). Luvut eivät muuttuneet.

![UI v2, jäinen kamera auki](docs/progress/2026-11-09/ui-v2-desktop-jaa.png)

<img src="docs/progress/2026-11-09/ui-v2-mobiili-ei-mittausta.png" width="300" alt="UI v2, mobiili, kamera ilman mittausta">


**Saman päivän ominaisuuskierros (v3):** aikajana, Liukastumassa-lista, tiekohtainen näkymä, viralliset
liikennesäävaroitukset ja englanti. Luvut eivät muuttuneet (malli ei vielä käytössä).

![Liukastumassa](docs/progress/2026-11-09/ui-v3-liukastumassa.png)
![Tie 6](docs/progress/2026-11-09/ui-v3-tie-6.png)
![Englanti ja aikajana klo 9](docs/progress/2026-11-09/ui-v3-en-aikajana.png)
![Liikennesäävaroitus](docs/progress/2026-11-09/ui-v3-varoitus.png)

<img src="docs/progress/2026-11-09/ui-v3-mobiili-liukastumassa.png" width="300" alt="Mobiili, Liukastumassa">

### 2026-11-11 · UI-kierrokset ja paneelien uusi ilme (v4)

Hajotustesti, viisi persoona-arviota ja Lighthouse (mobiili 82 → 100, saavutettavuus 90 → 100), sitten yhtenäinen
komponenttijärjestelmä paneeleille. Luvut eivät muuttuneet (malli ei vielä käytössä).

| Ennen (v3) | Jälkeen (v4) |
|---|---|
| ![](docs/progress/2026-11-11/ui-v3-ennen-desktop.png) | ![](docs/progress/2026-11-11/ui-v4-desktop.png) |

<img src="docs/progress/2026-11-11/ui-v3-ennen-mobiili.png" width="260" alt="Mobiili ennen"> <img src="docs/progress/2026-11-11/ui-v4-mobiili.png" width="260" alt="Mobiili jälkeen">
