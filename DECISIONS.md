# Päätösloki

Jokaisesta päätöksestä: mitä tehtiin, miksi, mitä jätettiin tekemättä ja miksi.
Uudet merkinnät lisätään loppuun.

---

## 2026-11-09 · Aiheen valinta

**Päätös:** Kelikamera AI: tien pinnan tilan ja kitkan arviointi kelikamerakuvista.

**Miksi:** Haluttiin kunnianhimoinen "oikea" projekti, jossa on dataa ja paljon muutakin (konenäkö,
kartta, pelillistys) ja joka ei maksa mitään. Data on avointa ja elävää, ja projektilla voi olla oikeita käyttäjiä.

**Mitä jätettiin:**
- *Itseajava pienoisauto:* kiinnostava, mutta vaatii 200–400 € rautaa. Digitaalinen simulaattoriversio
  on mahdollinen myöhemmin, mutta siitä puuttuisi "oikean maailman" vaikein osa.
- *Koripallo konenäöllä:* riskisin saada valmiiksi.
- *BM Myynnin 3D-autoesittely:* jäädytetty. Hunyuan3D:n lisenssi ei salli käyttöä EU:ssa, ja realistinen
  3D vaatisi auton kuvaamista uudestaan (Gaussian splatting).
- *K-kauppojen startup-idea:* parkissa, ei hylätty. Ensin selvitystä (haastattelut) ennen koodia.

## 2026-11-09 · Opetusdata automaattisesti sääasemista

**Päätös:** Kuvia ei merkitä käsin. Jokaisella kameralla on rajapinnassa `nearestWeatherStationId`, ja
kuva yhdistetään sen aseman anturiarvoihin (tienpinnan tila, optinen keli, kitka, lämpötilat) samalta hetkeltä.

**Miksi:** Käsin merkitseminen ei skaalaudu, ja asemat mittaavat juuri sitä, mitä halutaan ennustaa.

**Riski, joka tiedostetaan:** kamera ja asema eivät ole samassa paikassa, joten osa tunnisteista on väärin.
Tätä tutkitaan, kun dataa on kertynyt (esim. etäisyys kamera ↔ asema).

## 2026-11-09 · Keruu GitHub Actionsissa

**Päätös:** Keräin ajetaan GitHub Actionsissa 3 tunnin välein (minuutilla 17).

**Miksi:** Ei riipu siitä, onko oma kone päällä. Ilmainen.

**Jätettiin:** keruu omalla koneella (kone ei ole aina päällä, ja talvidata on aikakriittistä).
Minuutti 17 valittiin, koska GitHub viivästyttää tai pudottaa tasatuntien ajoja ruuhkassa.

## 2026-11-09 · Data Hugging Faceen, ei GitHubiin

**Päätös:** Kuvat ja anturidata yksityiseen Hugging Face -datasettiin.

**Miksi:** Mitattu datamäärä (~40 Mt/ajo, ~320 Mt/päivä) täyttäisi GitHub-repon viikossa, ja kuvat jäisivät
git-historiaan pysyvästi. Hugging Face on tehty koneoppimisdatalle: ilmaistilillä on 100 Gt taattua yksityistä tilaa.

**Miksi yksityinen eikä julkinen:** yksityinen tila on luvattu, julkinen on "best-effort". Kuvissa näkyy
ajoneuvoja ja joskus ihmisiä, ja julkinen arkisto tekisi niistä pysyvää historiaa. Päätetään julkaisusta,
kun dataa on katsottu. Vaihto julkiseksi on yksi klikkaus.

## 2026-11-09 · GitHub-repo julkinen

**Päätös:** Koodirepo julkiseksi, data silti yksityisenä Hugging Facessa.

**Miksi:** Repossa ei ole salaisuuksia (token on GitHubin Secretsissä), Actions-minuutit ovat julkisessa
repossa ilmaisia, ja koodi sekä päätösloki näkyvät portfoliossa.

**Seuraus:** GitHub poistaa julkisen repon ajastuksen käytöstä 60 päivän hiljaisuuden jälkeen. Siksi
workflow tekee joka maanantai pienen heartbeat-commitin.

## 2026-11-09 · Yksi tiedosto per ajo

**Päätös:** Jokainen ajo pakataan yhdeksi tar-tiedostoksi (`out/YYYY/MM/DD/<aika>.tar`).

**Miksi:** Hugging Face suosittelee alle 100 000 tiedostoa per repo. Erillisinä kuvina talvesta tulisi
satoja tuhansia tiedostoja, tar-tiedostoina noin tuhat.

**Jätettiin:** Parquet-muoto. Se vaatisi lisäkirjaston, eikä siitä ole hyötyä ennen koulutusvaihetta.
Muunnos on helppo tehdä myöhemmin.

## 2026-11-09 · Mitä kerätään

**Päätökset:**
- **Yksi kuvakulma per kamera.** Ensisijaisesti "Tienpinta"-kulma (suuntakoodi 9), joka kuvaa suoraan tien
  pintaa. Muuten ensimmäinen kulma. Tulos: 550/797 kuvaa on tienpintakulmia.
- **Kuvat pienennetään 640 px leveyteen, JPEG-laatu 80.** Keskikoko mitattuna 48 kt (arvio 30–40 kt oli alakanttiin).
  Kelin tunnistukseen ei tarvita alkuperäistä 1280×720:tä.
- **Yli 2 tuntia vanhat kuvat ohitetaan** (kamera jumissa). Ensimmäisessä ajossa 17 kpl.
- **Tiesääasemien koko raakadata tallennetaan**, ei vain valittuja antureita. Tulkinta tehdään myöhemmin.
- **Kameroiden metatiedot välimuistiin 7 päiväksi**, ettei jokainen ajo tee 815 ylimääräistä kutsua Digitrafficiin.

**Jätettiin:** muut kuvakulmat (2 274 kulmaa = ~13 Gt/päivä täysikokoisina, liikaa). Voidaan lisätä myöhemmin,
jos tienpintakulmat eivät riitä.

**Laskelma:** 8 ajoa/päivä × ~40 Mt ≈ 320 Mt/päivä ≈ 39 Gt neljässä kuukaudessa, eli alle 100 Gt:n rajan.

## 2026-11-09 · Ensimmäinen täysi ajo: havainnot

- 815 kameraa → 797 kuvaa, 40 Mt, 27 s.
- 748 kuvalla on lähimmän aseman data. 720:llä on tienpinnan tila ja 440:llä kitka.
- **Yökuvat:** kamerat kuvaavat pimeällä infrapunalla mustavalkoisena. Vain 3/797 oli mustia (klo 18 Suomen aikaa).
  Malli joutuu oppimaan kaksi eri kuvatyyppiä (päivä värillinen, yö IR).

## 2026-11-09 · Keruu käynnissä pilvessä

- Repo: github.com/petudesign/kelikamera (julkinen). Datasetti: petudesign/kelikamera (yksityinen, Hugging Face).
- GitHubin automaattisesti luoma README ja Node.js-.gitignore korvattiin projektin omilla. Historia säilytettiin
  (rebase, ei pakotettua pushia).
- `HF_REPO` oli aluksi `hf-petudesign/kelikamera`: ohjeen esimerkin etuliite tarttui mukaan. Korjattiin
  muotoon `petudesign/kelikamera` ennen ensimmäistä ajoa.
- Ensimmäinen ajo käsin 16:21 UTC: 797 kuvaa, 40,1 Mt, ladattu Hugging Faceen. Koko ajo kesti 2 min
  (keruu 78 s, pilvessä hitaampi kuin paikallisesti 27 s). Datasetti ei näy kirjautumattomalle (HTTP 401).
- Tästä eteenpäin ajastus 3 h välein.

## 2026-11-09 · Tunnisteiden lähde

**Selvitys:** Fintraffic ei julkaise koodistoa antureille `TIENPINNAN_TILA_*` ja `OPTISEN_ANTURIN_KELI*`.
Rajapinta palauttaa tyhjät selitteet, ja OpenConditions-projekti toteaa saman. Muiden projektien arvaukset
ovat keskenään ristiriitaisia (digitraffic_hacs: 0 = kuiva; Katu-Maps: vanha KELI-koodisto). Fintraffiicin
omassa koodissa (tmfg/digitraffic-road, `V1.4.12__Sensor_value_descriptions.sql`) on koodisto vanhalle
`KELI_1`-anturille: 0 vika, 1 kuiva, 2 kostea, 3 märkä, 4 märkä+suola, 5 kuura, 6 lumi, 7 jää,
8 tod. kostea+suola, 9 sohjoinen.

**Tarkistus datasta** (koodi vs. samalla asemalla mitatut määrät, ajo 2026-11-09 16:02):
- `OPTISEN_ANTURIN_KELI1` käyttäytyy täsmälleen KELI-koodiston mukaan: 1 → vettä 0 mm ja kitka 0,82;
  2 → vettä 0,03 mm; 3 → vettä 0,13 mm ja kitka 0,78; 6 → lunta; **7 → jäätä 1,8 mm ja kitka 0,11.**
- `TIENPINNAN_TILA_1` noudattaa eri koodistoa: 1 kuiva, 2 kostea/märkä, 11 näyttää jäältä (kitka 0,11),
  0 todennäköisesti vika. 3 ja 10 epäselviä.

**Päätös:** Luokka tulee optisesta anturista (KELI-koodisto), ja lisäksi tallennetaan mitatut suureet: kitka,
vesi, lumi ja jää (mm) sekä lämpötilat. Kitka on lopulta tärkein ennustettava asia, koska se kertoo
liukkauden suoraan. `TIENPINNAN_TILA_1` tallennetaan raakana, mutta sitä ei käytetä luokkana.

**Luokat:** kuiva · kostea (2, 8) · märkä (3, 4) · luminen (6, 9) · jää/kuura (5, 7). Suolaisuus ei näy
kuvasta, joten suola-alaluokat yhdistetään.

**Jätettiin:** `TIENPINNAN_TILA_1` luokkana. Sillä saataisiin noin kaksinkertainen kattavuus (419 asemaa
vs. 252), mutta koodiston arvaaminen tuottaisi väärää opetusdataa. Arvioidaan uudelleen, jos koodisto
selviää tai talvidata vahvistaa tulkinnan.

**Kuvan ja mittauksen aikaero** saa olla enintään 30 min.

## 2026-11-09 · Luokkalaskuri, ensimmäinen tulos

`collector/count.py` kertoo per luokka kuvat, **eri kamerat** (tärkeämpi kuin kuvamäärä, koska saman
kameran kuvat muistuttavat toisiaan), yökuvat (IR) ja mediaanikitkan. Alustava "valmis"-raja on 30 eri
kameraa per luokka.

Ensimmäinen tilanne (1 täysi ajo): kuiva 138 kameraa, kostea 49, märkä 69, **luminen 3, jää/kuura 2**.
Odotetusti talviluokat puuttuvat vielä.

**Havainnot:**
- 256/553 tienpintakuvasta jää ilman tunnistetta, koska lähimmällä asemalla ei ole optista anturia.
- **Kamera ↔ lähin asema: mediaani 3,5 km, mutta 10 % yli 21 km ja pisin 98 km.** Kaukaiset parit ovat
  todennäköisesti vääriä tunnisteita (eri tie, eri keli). Etäisyysraja (alustavasti esim. 5 km) päätetään,
  kun nähdään, paljonko se karsii talviluokkia.

## 2026-11-09 · Karttasivun ensimmäinen versio

**Päätös:** Staattinen sivu `site/` (MapLibre + OpenFreeMapin tumma tyyli), dataa tuottaa
`collector/build_site.py` → `site/data/latest.json`. Tehtiin heti anturidatalla, ei odotettu mallia.

**Miksi nyt:** Sivu näyttää jo nyt projektin idean. Värilliset pisteet ovat mitattua keliä, ja harmaat ovat
kameroita, joihin tekoäly tuo arvion. Ensimmäisessä ajossa 323 mitattua ja 474 harmaata.

**Valinnat:**
- **Etäisyysraja 5 km** kartalla: kauempana olevan aseman mittausta ei näytetä kameran kelinä. Sama raja on
  alustavasti tarkoitus käyttää opetusdatassa.
- **Kuvaa ei kopioida sivulle**, vaan näytetään Fintraffiicin tuore kuva suoraan heidän osoitteestaan.
  Arkistomme pysyy yksityisenä (ks. tietosuojamerkintä).
- **OpenFreeMap** taustakartaksi: ilmainen ilman avainta, myös kaupalliseen käyttöön.
- **Ei palvelinta.** Tarkoitus on, että sama Actions-ajo rakentaa datan ja julkaisee sivun GitHub Pagesiin.
  Julkaisua ei ole vielä tehty.

**Jätettiin myöhemmäksi:** aikajana, tekoälyarviot, GitHub Pages -julkaisu, "Arvaa keli" -peli.

**Lisäys samana päivänä, kartan rajaus:**
- Kartta lukitaan Suomeen **näytön muodon mukaan**: Suomi sovitetaan näkymään, ja siitä lasketaan loitonnuksen ja
  vetämisen raja. Kiinteä raja-alue ei toiminut, koska leveällä näytöllä Suomen päät jäivät reunojen yli.
- **Suomen ulkopuoli himmennetään** maskilla. Rajat ovat Natural Earthin 1:50m-aineistosta (public domain,
  `site/data/finland.geojson`, 19 kt). Aineisto on karkea lähellä katsottuna, joten himmennys häivytetään pois
  zoomattaessa sisään (zoom 9). Tarkempi 1:10m-aineisto olisi ~25 Mt, eikä se ole tarpeen tässä mittakaavassa.

## 2026-11-09 · Edistymisen dokumentointi

**Päätös:** `PROGRESS.md` + kuvat kansiossa `docs/progress/<pvm>/`. Samat mittarit joka kerta
(kamerat, mitattu, tekoälyn arvio, ei tietoa, mallin tarkkuus), ja kuvat otetaan aina samalla skriptillä
(`tools/screenshot.py`: Chrome ilman ikkunaa, odottaa kartan latautumisen, 1600×1000 @2x ja 390×844 @3x).

**Miksi:** Lopussa halutaan konkreettinen "ennen ja jälkeen" -näyttö portfolioon. Se on uskottava vain, jos
mittarit on määritelty etukäteen eikä valittu jälkikäteen parhaan näköisiksi.

**Sääntö väitteille:** kattavuus esitetään aina yhdessä tarkkuuden kanssa. Pelkkä "kattavuus 40 % → 100 %"
olisi harhaanjohtava, koska sen saisi myös arvaamalla.

**Lähtötaso:** 797 kameraa, 323 mitattua (40,5 %), 474 ilman tietoa (59,5 %).

**Tekninen huomio:** Chromen oma `--screenshot` otti kuvan ennen kuin kartta ehti latautua (musta kartta).
Siksi työkalu ohjaa Chromea DevTools-protokollalla ja odottaa, kunnes `map.areTilesLoaded()` on tosi.
Lisäriippuvuus `websocket-client` on vain `requirements-dev.txt`:ssä, joten keräin ei tarvitse sitä.

## 2026-11-09 · Sovitut ominaisuudet ja 3 päivän arvio

**Päätös:** Tiekarttaan ([ROADMAP.md](ROADMAP.md)) otetaan viralliset ajokelivaroitukset, "Liukastumassa"-lista,
tiekohtainen näkymä, aikajana, tien seuraaminen ja 3 päivän liukkausriski.

**3 päivän arvio, selvitys:** Ilmatieteen laitoksen avoin data (opendata.fmi.fi, CC BY 4.0) sisältää
pistemäiset ennusteet ECMWF-mallista ja ilmatieteilijöiden muokatun ennusteen. Molemmat ulottuvat yli neljän päivän
päähän (tarkistettu Rovaniemelle 2026-11-09). Digitraffic tarjoaa lisäksi valmiin tiesääennusteen tieosuuksille
(0–12 h), joka toimii vertailukohtana lyhyelle aikavälille.

**Miten:** Ennustemalli oppii yhteyden "mitä sääennuste sanoi" → "mikä tien pinnan tila oikeasti oli" (antureista
ja myöhemmin kamerakuvista). **Tämä vaatii, että ennusteet arkistoidaan nyt.** Jälkikäteen ei saa tietää, mitä
ennuste sanoi aikanaan, vaan ainoastaan mitä tapahtui. Siksi ennusteiden arkistointi on tiekartassa ensimmäisenä.

**Rajaus:** 3 päivän arvio esitetään **riskitasona** (esim. "liukkausriski huomenna yöllä: korkea"), ei tarkkana
keliluokkana, koska tarkkuus heikkenee ennustepituuden kasvaessa. Mallin pitää voittaa yksinkertainen vertailukohta
("pakkasta ja sadetta ennustettu → riski") ja lyhyellä aikavälillä Digitrafficin oma ennuste. Muuten sitä ei julkaista.

## Avoimet kysymykset

- `TIENPINNAN_TILA_1`:n koodisto (3, 10). Kysytään tarvittaessa Digitrafficin Google-ryhmästä.
- Etäisyysraja kameran ja aseman välille.
- Kannattaako keruuta tihentää, kun keli muuttuu nopeasti (esim. lämpötila nollan tuntumassa)?
