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

## 2026-11-09 · Paneelien uusi ilme (UI v2)

**Lähtökohta:** Paneelit näyttivät geneerisiltä "AI-tehdyiltä": pyöristetyt lasikortit taustasumennuksella,
pillerisirut pisteineen, sateenkaariliukuväri kitkapalkissa, isoilla kirjaimilla harvennetut mikro-otsikot,
katkoviivalaatikko.

**Päätös:** Mittaristomainen, suoralinjainen ilme (Swiss-minimalismi, tiivis tietotyökalu). ui-ux-pro-max-skillin
suosituksista otettiin tyyli, tiheys ja Fira Sans -fontti. Sen
ehdottamaa vaaleaa yritysportaalipalettia ja sivurakennetta ei otettu, koska ne eivät sovi karttatyökaluun.

- **Selite = taulukko:** värineliö, nimi, määrä tasalevyisenä ja ohut osuuspalkki (osuus kaikista kameroista).
  Rivit ovat painikkeita (`aria-pressed`), ja pois päältä oleva rivi näkyy yliviivattuna ja ontolla neliöllä,
  joten tila ei ole pelkän värin varassa.
- **Tietopaneeli = lukemataulu:** tila 6 px värinauhana ja isona otsikkona, arvot riveinä ohuin viivoin
  erotettuina.
- **Kitka värillisenä palkkina** (punainen → keltainen → vihreä) valkoisella merkillä ja päätyselitteillä
  "Liukas · jää ~0,1" / "Pitävä · kuiva 0,82". Kokeiltiin ohutta numeroviivainta, mutta palautettiin palkki
  käyttäjän palautteesta: palkista näkee yhdellä silmäyksellä, ollaanko liukkaalla vai pitävällä alueella,
  kun viivain vaati numeroiden lukemista. Väri ei ole ainoa tiedon kantaja, koska arvo ja selitteet ovat tekstinä.
- **Ei tasalevyistä fonttia** (Fira Code poistettiin käyttäjän toiveesta). Numerot ovat Fira Sansia
  tasalevyisillä numeromuodoilla (`tabular-nums`), jotta lukemat asettuvat siististi allekkain.
- **Näkyvä fokus** (2 px keltainen) ja 40 px sulkemispainike. Paneelin liuku poistetaan, jos käyttäjä on
  pyytänyt vähemmän liikettä.

**Korjattu samalla:** selitteen klikkaus ennen kuin kartan tasot latautuivat heitti virheen. Nyt suodatus
otetaan käyttöön, kun tasot ovat valmiina.

**Työkalu:** `tools/screenshot.py` ottaa nyt valinnaisen JS-komennon (esim. paneelin avaus) ja raportoi sivun
JS-virheet, joten rikkinäinen sivu ei mene kuvana läpi huomaamatta.

## 2026-11-09 · Ennusteiden arkistointi ja siirto Digitrafficin v2-rajapintaan

**Löydös:** Digitrafficin openapi-kuvauksen mukaan käyttämämme `weather/v1`-rajapinnat on merkitty
vanhentuneiksi ja **poistuvat 2027-04-13**, eli kesken tämän talven keruun. Tieosuusennusteiden v1 oli
merkitty poistuvaksi jo 2026-11-03. Kelikamerarajapinta (`weathercam/v1`) ei ole vanhentunut.

**Päätös:** Keräin käyttää sääasemille v2:ta (`/api/weather/v2/stations/data`, `/stations`, `/sensors`,
`/forecast-sections/forecasts`). Rakenne on sama, joten tunnisteiden tulkinta ei muuttunut.

**Ennusteet jokaiseen keruuajoon**, samaan tar-tiedostoon kuvien kanssa:
- `forecast_road.json.gz`: Digitrafficin tiesääennuste kaikille 9 302 tieosuudelle (0, 2, 4, 6, 12 h) sellaisenaan.
- `forecast_fmi.json.gz`: Ilmatieteen laitoksen **muokattu ennuste** (`fmi::forecast::edited::weather::scandinavia`)
  jokaisen 532 tiesääaseman kohdalle, 3 h välein 96 h eteenpäin: lämpötila, kastepiste, kosteus, sade,
  pilvisyys ja tuuli. Tiivis muoto (asemat × ajat × suureet).
- Mitattu lisäkoko: **0,5 Mt per ajo** (~4 Mt/pv).
- Ennusteen epäonnistuminen ei kaada kuvien keruuta; virhe kirjataan manifestiin (`forecastErrors`).

**Miksi muokattu ennuste eikä ECMWF:** Muokattu ennuste on sama, jonka ihmiset näkevät, ja siihen
ilmatieteilijät ovat jo yhdistäneet mallit. ECMWF:n raakaennuste voidaan lisätä myöhemmin vertailuksi.

**Tekninen huomio:** Ilmatieteen laitoksen moniasemahaku toimii toistetulla `latlon`-parametrilla
(`latlons` palautti nollan tulosta). 60 asemaa per pyyntö, eli 9 pyyntöä per ajo.

**Kameroiden metatiedot (versio 3):** lisättiin tieosoite (tieosa + etäisyys, tiekohtaista järjestystä varten)
ja nimet kolmella kielellä (fi/sv/en).

**Ei vielä pilvessä:** Arkistointi alkaa vasta, kun keräin pushataan GitHubiin.

## 2026-11-09 · Aikajana, Liukastumassa, tiekohtainen näkymä, varoitukset ja kielet

**24 h historia:** Digitrafficin v2-rajapinnassa on asemakohtainen historia (enintään 24 h, 5 min välein).
`build_site.py` hakee sen 166 asemalle (optinen anturi ja alle 5 km kamerasta), kaksi anturia per asema
(keliluokka ja kitka), ja tiivistää tunneittain (kunkin tunnin viimeisin arvo, enintään 1 h vanha).
*Miksi tämä eikä oma arkisto:* toimii heti eikä vaadi satojen megatavujen lataamista Hugging Facesta
sivun rakentamiseen. Oma arkisto on tarkoitettu opetusdataksi.

**Aikajana:** liukusäädin −24 h … nyt sekä toisto. Kartan värit, selitteen määrät, tiekohtainen nauha ja
kameran paneeli seuraavat valittua hetkeä. Mennyt hetki näkyy keltaisena tekstinä, ettei sitä luule nykyhetkeksi.

**Liukastumassa-sääntö** (määritelty etukäteen, ei datan perusteella valittu):
kamera listataan, jos (a) keli on nyt luminen/sohjoinen tai jäinen ja jokin viimeisen 6 tunnin
mittauksista oli parempi, tai (b) kitka on pudonnut vähintään 0,25 kuuden tunnin sisällä ja on nyt alle 0,5.
Järjestys: huonoin keli ensin, sitten tuorein muutos. Ensimmäisellä ajolla 6 kameraa: vt 6 Lappeenrannassa
neljä ja vt 7 Virolahdella yksi muuttui kuivasta lumiseksi tunnin sisällä (lumikuuro), sekä Enontekiö (luminen → jää).

**Tiekohtainen näkymä:** tiet, joilla on vähintään 3 mitattua kameraa. Kamerat järjestetään tieosoitteen
mukaan (tieosa, sitten etäisyys osan alusta). Näkymässä on värinauha tien alusta loppuun, pahin kohta ja lista.
Kartta rajautuu valittuun tiehen.

**Viralliset liikennesäävaroitukset:** Ilmatieteen laitoksen CAP-syöte, `eventCode = trafficWeather`.
Yksi syöte riittää, koska jokaisessa varoituksessa on info-osa per kieli (fi/sv/en). Alueet ovat suljettuja
polygoneja (tuhansia pisteitä), joten ne yksinkertaistetaan Douglas–Peuckerilla (toleranssi 0,01°): 4 varoitusta
= 77 kt. *Bugi matkalla:* suljetun renkaan yksinkertaistus romahti kahteen pisteeseen (alku = loppu). Korjattu
jakamalla rengas kauimmaisen pisteen kohdalta.
- **Kartalla vain sillä hetkellä voimassa olevat varoitukset.** Ensimmäinen versio piirsi kaikki neljä
  (ti–la), ja koko Keski-Suomi peittyi keltaiseen, vaikka yksikään ei ollut voimassa. Tulevat näkyvät listalla
  merkinnällä "tulossa", ja kartalla vain kun ne avataan.
- Esitetään erillään omista tiedoista: katkoviivareunus, otsikko "Virallinen varoitus · Ilmatieteen laitos",
  alkuperäinen teksti ja linkki lähteeseen.

**Kielet:** suomi ja englanti. Kaikki tekstit ovat yhdessä sanakirjassa (`STR`), kameroiden nimet tulevat
Fintrafficilta ja varoitukset Ilmatieteen laitokselta valitulla kielellä. Kieli valitaan järjestyksessä:
`?lang=`, aiempi valinta (localStorage), selaimen kieli. Ruotsi on myöhemmin pelkkä uusi sanakirja.
*Miksi nyt:* sivulla on vähän tekstiä, ja jälkikäteen jokainen näkymä pitäisi käydä uudestaan läpi.

**Mobiili:** vasen kortti on puhelimessa oletuksena taitettu (näkyvät otsikko ja välilehdet), ja välilehden
napautus avaa sen. Kun listasta valitsee kameran, kortti taittuu ja kartta siirtää kameran paneelin yläpuolelle.

**Jätettiin:**
- *Tien seuraaminen ja ilmoitukset:* vaatii ilmoituskanavan (esim. Telegram-botti) ja tallennettavan tilan, joten
  se tehdään omana kokonaisuutenaan.
- *GitHub Pages -julkaisu:* käyttäjän päätöksellä vasta, kun sivu on valmiimpi.
- *Ruotsi:* myöhemmin, rakenne on valmis.

## 2026-11-09 · Logo, vaaleammat paneelit ja aikajana pylväiksi

**Logo:** oma SVG-merkki: kameran rungossa linssi, jonka sisällä on perspektiivissä kapeneva tie
**keltaisella keskiviivalla** (kuten suomalaisilla teillä) ja punainen "tallentaa"-piste. Toimii yhdellä
värillä 22 px:n koossa, ja sama merkki on selaimen välilehden kuvake (inline-SVG, ei erillistä tiedostoa).
Valmiita ikonikirjastoja ei käytetty, koska geneerinen kameraikoni ei kerro tiestä mitään.

**Paneelit vaaleammiksi** käyttäjän palautteesta: pinta #121519 → #171b21, korostus #181c22 → #1f242c ja
reunat #262b33 → #2e353f. Kartan tausta pysyi ennallaan, joten kontrasti kartan ja paneelien välillä kasvoi.

**Aikajana:** pelkkä liukusäädin korvattiin **25 pylväällä, yksi per tunti**. Kukin pylväs näyttää, mikä osuus
mitatuista kameroista oli missäkin kelissä (kuiva alimpana, jää ylimpänä). Valittu tunti korostuu
valkoisella reunuksella, menneet tunnit himmeämpinä. Asteikossa on kellonajat (19.00, 01.00, …, Nyt)
"−12 h":n sijaan. Ensimmäisessä datassa näkyy suoraan yön märkyys ja päivän kuivuminen.
- Saavutettavuus: alla on edelleen tavallinen `input[type=range]` (näkymätön), joten näppäimistö ja
  ruudunlukijat toimivat. Fokus näkyy koko aikajanan ympärillä.
- Mennyt hetki näytetään muodossa "ma klo 11.00" (aiemmin "Klo ma 11.00").

**Varoitusten lähde:** irrallinen "Ilmatieteen laitos" -rivi listan lopussa näytti otsikolta. Nyt otsikon alla
on kuvaus "Ilmatieteen laitoksen viralliset varoitukset", ja otsikko on vahvempi.

## 2026-11-09 · Mobiilin sulkemisbugi, varoitukset omaan paneeliin, väljempi kortti

**Bugi: sulkemisrasti ei toiminut.** Painikkeessa oli `onclick="close()"`. Selain etsii inline-käsittelijän
nimet ensin elementistä ja `document`-oliosta, jolloin `close()` osui `document.close()`-metodiin eikä
omaan funktioon. Työpöydällä bugi jäi piiloon, koska paneelin sai kiinni klikkaamalla karttaa. Mobiilissa
karttaa ei paneelin ja kortin välissä juuri näkynyt, joten paneelia ei saanut kiinni lainkaan.
*Korjaus:* funktio nimettiin `closePanel`, ja painikkeet käsitellään delegoidulla kuuntelijalla (ei inline-käsittelijöitä).

**Mobiili:**
- Kun kamera- tai varoituspaneeli avautuu, vasen kortti taittuu automaattisesti, jotta kartta näkyy.
- Paneelin saa kiinni pyyhkäisemällä alas kahvasta tai otsikosta (90 px:n alue yläreunassa, ja vain kun
  paneelin sisältö on vieritetty ylös, ettei vieritys sekoitu sulkemiseen).
- **Liikennesäävaroitukset pois kortista:** Kartta-välilehdellä on puhelimessa yksi rivi "Liikennesäävaroitukset
  4 ›", joka avaa listan alhaalta nousevaan paneeliin. Aiemmin neljä varoitusta täytti kortin ja peitti kartan.
  Työpöydällä lista pysyy kortissa.

**Työpöytä: väljempi kortti** käyttäjän palautteesta ("ahtaan oloinen"). Ahtaus johtui siitä, että kaikki välit
olivat samaa pientä kokoa, joten pelkkä varoitusten yläpuolen tila ei olisi riittänyt. Muutokset: reunat
14 → 16 px, osioiden yläväli 10 → 18 px (osioiden väli nyt selvästi suurempi kuin rivien), selitteen rivit
ja varoitusrivit korkeammiksi, varoitusotsikot 13 → 14 px ja kortti 336 → 356 px.

**Testaus:** sulkeminen, taittuminen ja varoituspaneeli testattu Chromella ilman ikkunaa (mobiilikoko 390×844).
Pyyhkäisyä ei voi testata tällä tavalla, joten se on tarkistettava oikealla puhelimella.

## 2026-11-09 · Kortti ilman vierityspalkkia

**Ongelma:** vasemman kortin korkeus oli rajattu (ruutu − 120 px), koska lähdetiedot olivat kortin alla, ja
sisältö (~870 px) ei mahtunut tavallisiin läppärinäyttöihin. Mitattu: 1280×720, 1366×768, 1440×800 ja
1536×864 vierittivät. Vain 1440×900 ja 1920×1080 mahtuivat.

**Päätös:**
- Kortti saa käyttää koko korkeuden (ruutu − 32 px). **Lähdetiedot siirrettiin kortin alaosaan.** Samalla ne
  näkyvät nyt myös puhelimessa, missä ne olivat aiemmin piilossa, vaikka OpenStreetMapin lisenssi edellyttää
  attribuution näkymistä.
- **Alle 900 px korkeilla näytöillä varoituslista tiivistyy riviksi** "Liikennesäävaroitukset 4 ›", joka avaa
  listan oikeanpuoleiseen paneeliin (sama malli kuin puhelimessa). Korkeilla näytöillä lista näkyy kortissa.
  Tiivistetyn kortin sisältö on 460 px, joten se mahtuu kaikissa mitatuissa koissa.
- Jos jokin lista (Liukastumassa, Tiet) on silti pidempi kuin tila, vierityspalkki on ohut ja kortin värinen.

**Jätettiin:** väljyyden pienentäminen (käyttäjä halusi juuri lisää väljyyttä) ja selitteen muuttaminen kahteen
sarakkeeseen työpöydällä (osuuspalkit eivät toimi kapeissa sarakkeissa).

## 2026-11-09 · Varoitukset avautuvat työpöydällä alaspäin

**Muutos edelliseen:** matalilla työpöytänäytöillä varoitusrivi avasi listan oikeaan paneeliin. Nyt se avautuu
**rivin alle** (nuoli kääntyy alas, `aria-expanded`). Puhelimessa lista avautuu edelleen alhaalta nousevaan paneeliin.

**Miksi:**
- Sama logiikka kaikilla työpöytänäytöillä: korkealla näytöllä lista on jo kortissa.
- Oikea paneeli näyttää aina yhden asian (kamera tai varoitus). Kun sinne avautui lista, varoituksen avaaminen
  korvasi listan, eikä takaisin päässyt. Nyt lista pysyy kortissa, ja varoituksia voi käydä läpi yksi kerrallaan.
  Avattu varoitus korostuu listassa keltaisella.
- Vieritys on hyväksyttävää, kun käyttäjä itse avaa listan. Oletustilassa kortti mahtuu edelleen ilman vierityspalkkia.

## 2026-11-09 · Reittihaku

**Miksi:** Kaikki eivät tiedä tienumeroita, mutta tietävät, minne ovat menossa ("kotoa Leville").

**Toteutus:** uusi välilehti *Reitti*: Mistä/Minne-haku ehdotuksineen ja "Oma sijainti". Reitti piirretään kartalle,
reitin kamerat korostetaan ja muut himmennetään. Yhteenvedossa: matka ja aika, kelijakauma mitatuilla kohdilla,
liukkaat kohdat ja ensimmäisen etäisyys lähdöstä, reitille osuvat liikennesäävaroitukset ja ilman mittausta olevien
kameroiden osuus. Lisäksi nauha kelistä kilometreittäin ja kamerat järjestyksessä km-lukemineen.

**Palvelut** (molemmat ilmaisia, CORS sallittu, testattu selaimesta):
- Paikkahaku: **Photon** (komoot, OpenStreetMap-data), rajattu Suomen alueeseen.
- Reititys: **OSRM FOSSGISin palvelimella** (routing.openstreetmap.de). Helsinki → Levi: 999 km, n. 13 h 30 min.
- *Rajoitus:* molemmat on tarkoitettu kohtuukäyttöön, eikä niillä ole palvelutasolupausta. Siksi haku tehdään
  vasta 350 ms kirjoittamisen jälkeen (vähintään 3 merkkiä, edellinen pyyntö perutaan), ja reitti haetaan kerran
  per valinta. Jos käyttö kasvaa, vaihtoehdot ovat oma OSRM-palvelin tai maksullinen palvelu (esim. GraphHopper)
  välityspalvelimen takana, jottei avain näy selaimessa.

**Kameran kuuluminen reittiin:** enintään 0,6 km reittiviivasta **ja** kameran tienumero on reitin tienumeroiden
joukossa (OSRM:n reittiohjeiden `ref`, esim. "4; 77"). Pelkällä etäisyydellä mukaan tuli risteävien teiden
kameroita (esim. Kehä III Vantaalla vt 4:n risteyksessä): Helsinki–Levi 80 → 72 kameraa tienumerosuodatuksella.

**Varoitukset reitillä:** varoitusalue lasketaan osuvaksi, jos jokin reitin pisteistä (joka 25.) on alueen sisällä.
Yhteenvedossa on yksi rivi (määrä + ensimmäisen alkuhetki), ja "Näytä varoitukset" avaa vain reitin varoitukset.

**Sanavalinnat:** yhteenveto kertoo mittaukset ("Liukasta 2 kohdassa"), ei neuvo ajamaan tai olemaan ajamatta.
Alla on maininta: "Tilannekuva mitatuista kohdista, ei ajokeliennuste. Tarkista viralliset varoitukset ennen lähtöä."

**Jätettiin:** reitin kiertoreittien vertailu (esim. vt 4 vs. vt 5), välipisteet ja reitin tallennus. Ne sopivat
"Tien seuraaminen" -kokonaisuuteen.

## 2026-11-09 · Julkaisu GitHub Pagesiin

**Päätös:** Sama 3 tunnin keruuajo rakentaa sivun datan (`build_site.py`) ja julkaisee `site/`-kansion Pagesiin
(`upload-pages-artifact` + `deploy-pages`). Osoite: https://petudesign.github.io/kelikamera/

**Valinnat:**
- **Generoitu data ei mene repoon** (`site/data/latest.json`, `warnings.json` ovat `.gitignore`ssa). Muuten
  jokainen ajo tekisi commitin, ja historia täyttyisi datamuutoksista. Repossa on vain `finland.geojson`, joka ei muutu.
- **Sivun rakentaminen ei saa kaataa keruuta:** rakennusvaihe on `continue-on-error`, ja julkaisu tehdään vain, jos
  se onnistui. Epäonnistuessa keruu on silti tallessa Hugging Facessa, ja sivu jää edelliseen versioon.
- Julkaisu omana työnään (`deploy`), koska Pages vaatii oman `github-pages`-ympäristönsä.

## 2026-11-09 · Mobiilikatselmus (Emil Kowalskin mobile-native- ja gestures-ohjeet)

**Lähtökohta:** pisteitä oli vaikea osua puhelimella, erityisesti harmaita (halkaisija 4–5 px). Sivu käytiin läpi
emilkowalski/skills-repon `mobile-native`- ja `gestures`-ohjeiden tarkistuslistoilla. Ohjeet luettiin
dokumentaationa, mitään ei asennettu.

**Korjaukset:**
- **Kosketusalue 44 px:** napautus valitsee lähimmän pisteen 22 px säteeltä (`pointer: coarse`), hiirellä 8 px.
  Pisteiden kokoa ei kasvatettu, koska ongelma oli osuma-alueessa, ei näkyvyydessä. Himmennetyt (reitin ulkopuoliset)
  pisteet eivät ole valittavissa.
- **Hakukentät 16 px** (oli 14 px). iOS zoomaa alle 16 px kenttiin eikä palaa takaisin. `enterkeyhint="search"`.
  Zoomausta ei estetty (`user-scalable=no` olisi saavutettavuusvirhe).
- **`100vh` → `100dvh`** (kortti ja alapaneeli; `vh` jää varalle vanhoille selaimille). Osoiterivi ei enää
  työnnä sisältöä näkyvistä.
- **Hover vain hiirelle** (`@media (hover:hover) and (pointer:fine)`), ja kaikille painikkeille välitön
  `:active`-palaute 100 ms. Kosketuksessa hover jäi aiemmin päälle.
- **Napautusvälähdys pois** (`-webkit-tap-highlight-color`), `touch-action: manipulation` (ei 300 ms viivettä),
  painikkeiden tekstiä ei voi valita pitkällä painalluksella.
- **Pull-to-refresh pois** (`overscroll-behavior: none` sivulle, `contain` vieritettäville listoille).
- **Notch ja kotipalkki:** `viewport-fit=cover` ja `env(safe-area-inset-*)` kortille, aikajanalle ja alapaneelille.
  `theme-color` sivun taustaväriin.
- **Alapaneelin pyyhkäisy** (gestures-ohjeet): seuraa sormea 1:1, ylöspäin vain kuminauhamainen vastus, ja sulkeutuu
  joko matkasta (> 80 px) tai nopeasta näpäytyksestä alas (> 0,5 px/ms). Otsikkoalueella `touch-action: none`, ettei
  selain vieritä kesken vedon. Paneelin liike iOS-tyylisellä käyrällä (`cubic-bezier(.32,.72,0,1)`, 450 ms).
  *Jätettiin:* Vaul-kirjasto. Se on React-komponentti, ja sivu on tarkoituksella ilman sovelluskehystä.

**Kamerakuvan teksti:** "Kamerakuva nyt" antoi ymmärtää, että kyse on livekuvasta. Nyt näytetään kuvan oikea ottoaika
Fintrafficin kamerarajapinnasta ("otettu 19.48 (1 min)"). Kuvapalvelin ei salli `Last-Modified`-otsakkeen lukemista
selaimesta (ei CORS), mutta rajapinta sallii. Aikajanalla mennyttä hetkeä katsottaessa lisäys "tuorein kuva, ei
valitulta hetkeltä".

**Vaatii oikean puhelimen** (ei näy selainemuloinnissa): kosketusalueen tuntuma, hover-jumit, napautusviive,
pull-to-refresh, notch-välit ja pyyhkäisy. Koodista tarkistettu: 16 px kentät, dvh, meta-tagit, tyylisäännöt.

## 2026-11-10 · GitHub pudotti ajastetut ajot, sivu päivittyy nyt tunnin välein

**Löydös:** käyttäjä huomasi, että kartan mittaukset näyttivät klo 03.30, vaikka kamerakuva oli klo 10.20.
Syyt:
1. **GitHub käynnisti 3 h ajastuksen vain kerran yössä** (01:35 UTC). Ajot klo 18, 21, 00, 06 ja 09 UTC jäivät
   tulematta. GitHub kertoo, että ajastettuja ajoja voidaan viivästää tai pudottaa ruuhkassa, ja uusilla repoilla
   näin käy erityisen usein. Neljän keruuajon verran talvidataa jäi saamatta.
2. **Sivun data tuli keruuajosta**, joten se oli yhtä vanha kuin viimeinen onnistunut ajo.
3. **Bugi:** "Mitattu"-aika näytti keruuajon kamerakuvan ajan, ei anturin mittausaikaa.

**Korjaus:**
- **Ajastus joka tunti** (minuutilla 17). Keräin tarkistaa Hugging Facesta uusimman ajon ajan ja **kerää kuvat vain,
  jos edellisestä on yli 2,5 h** (`--if-due 2.5`). Tavoitetiheys ja datamäärä pysyvät samoina (~3 h, ~40 Mt/ajo),
  mutta pudotettu ajo paikkautuu seuraavalla tunnilla.
- **Sivun data suoraan Digitrafficista** jokaisessa ajossa (kamerarajapinta + sääasemat v2), ei keruuajon tar-tiedostosta.
  Sivu päivittyy siis tunnin välein, vaikka kuvia ei kerättäisi.
- **"Mitattu" = anturin oma mittausaika** (`mt` = optisen kelianturin `measuredTime`).
- Pages-julkaisupaketin säilytys on oletuksena 1 päivä, joten tunnin julkaisut eivät kerrytä tallennustilaa.

**Toinen löydös: kamerat kuvaavat usein vain kerran tunnissa** (esim. Inkoo: kuva 10.18, anturi 11.08). Tunnisteiden
30 min sääntö (kuva ↔ anturi) hylkäsi aamulla 449/815 kuvaa. Tämä on oikein opetusdatalle, koska vanha kuva ja tuore
mittaus eivät välttämättä kuvaa samaa keliä, mutta karttaan sääntö ei sovi. **Kartta käyttää nyt tuorein anturilukemaa,
jos se on alle 90 min vanha**, riippumatta kuvan ajasta.
- *Avoin kysymys opetusdatalle:* kuinka suuri osa keruuajojen kuvista jää 30 min säännön ulkopuolelle eri vuorokaudenaikoina?
  Vaihtoehdot: käytetään anturin historiaa (5 min välein) ja otetaan kuvan ottohetkeä lähin mittaus nykyhetken sijaan.
  Tämä on todennäköisesti oikea korjaus, ja se tehdään ennen koulutusta.

**Jätettiin varalle:** ulkoinen ajastin (esim. cron-job.org käynnistämässä `workflow_dispatch`-ajon). Se vaatisi
käyttäjältä tunnuksen ja GitHub-tokenin. Otetaan käyttöön, jos tunnin ajastuskin osoittautuu epäluotettavaksi.

## Avoimet kysymykset

- `TIENPINNAN_TILA_1`:n koodisto (3, 10). Kysytään tarvittaessa Digitrafficin Google-ryhmästä.
- Etäisyysraja kameran ja aseman välille.
- Kannattaako keruuta tihentää, kun keli muuttuu nopeasti (esim. lämpötila nollan tuntumassa)?

## 2026-11-11 · Aikajanalla valitun hetken kamerakuva

**Löydös:** käyttäjä valitsi aikajanalta klo 3 ja avasi kameran (vt 8 Mustasaari), joka oli silloin punainen. Kuva oli
kuitenkin klo 10.13, eli väri ja kuva eivät olleet samalta hetkeltä. Digitrafficilla on kelikameroille 24 h kuvahistoria
(`/api/weathercam/v1/stations/{id}/history`): jokaisesta kuvakulmasta kuva noin 10 min välein ottoaikoineen. Rajapinta
sallii selainkutsut (CORS `*`), ja vanhat kuvat aukeavat suoraan `versionId`-osoitteista.

**Päätös:** kun aikajana on menneessä hetkessä, kamerapaneeli hakee kameran kuvahistorian ja näyttää valittua hetkeä
lähimmän kuvan ottoaikoineen ("otettu 02.55"). Jos lähin kuva on yli 20 min päässä valitusta hetkestä (esim. aikajanan
vanhin tunti on jo historian ulkopuolella), ero kerrotaan: "otettu 11.45 (2 h valitusta hetkestä)". Historia haetaan kerran
kameraa kohden ja päivitetään enintään 10 min välein, joten aikajanan selaus ja toisto eivät kuormita rajapintaa.
Jos haku epäonnistuu, näytetään tuorein kuva kuten ennenkin, ja siitä kerrotaan ("tuorein kuva, ei valitulta hetkeltä").

**Jätettiin:** kuvien tallennus sivun dataan rakennusvaiheessa. Se ei ole tarpeen, koska selain saa historian suoraan,
ja sivun data pysyy pienenä. Myös seuraavien kuvien esilataus jätettiin pois, kunnes toisto osoittautuu tökkiväksi.

**Seuraus keruulle (suunnitteilla, ei vielä tehty):** kuvahistoria (~10 min) ja anturihistoria (5 min) ulottuvat
molemmat 24 h taaksepäin. Keräin voi siis hakea jälkikäteen kuvat tasatunneilta ja yhdistää ne samalla hetkellä
mitattuun anturiarvoon. Silloin GitHubin pudottama ajo ei enää tarkoita menetettyä dataa (riittää, että yksi ajo menee
läpi vuorokaudessa), yökuvat saadaan talteen ja 30 min kuva–anturi-ongelma poistuu. Tämän takia ulkoista ajastinta
(cron-job.org) tai itseään käynnistävää työnkulkua ei toistaiseksi oteta käyttöön. Huom: 10.11.–11.11. tunnin ajastus
käynnistyi 21 tunnissa vain 3 kertaa.

## 2026-11-11 · Keruu kiinteistä keruuhetkistä historian avulla, talvitihennys

**Lähtökohta:** GitHub käynnisti tunnin ajastuksen 10.–11.11. vain 3 kertaa 21 tunnissa. Keruu riippui siitä, milloin
ajo sattui menemään läpi (välit 5–24 h), ja 30 min kuva–anturi-sääntö hylkäsi paljon kuvia, koska kamerat kuvaavat
usein vain kerran tunnissa. Digitrafficin kuvahistoria (kaikki kamerat yhdellä haulla, ~10 min välein) ja
anturihistoria (yksi haku per asema, kaikki anturit 5 min välein) ulottuvat ~23 h taakse.

**Päätös:**
- **Kiinteät keruuhetket**: joka 3. tasatunti UTC (00, 03, …, 21). Jokainen tunnin ajo tarkistaa Hugging Facesta, mitkä
  hetket viimeiseltä 22 h puuttuvat, ja hakee ne kaikki kerralla (yksi commit). Data ei katoa, kunhan yksi ajo menee
  läpi vuorokaudessa.
- **Kuva**: keruuhetkeä lähin kuva, enintään 10 min päässä. **Anturit**: kuvan ottohetkeä lähin arvo jokaiselle
  anturille, enintään 10 min päässä, tallennetaan suoraan kuvan tietoihin (`sensors`). Testissä kuva oli keskimäärin
  2,5 min (enintään 4,8 min) keruuhetkestä ja optinen anturi 1,1 min (enintään 2,4 min) kuvasta. Tunnisteiden aikaraja
  on uudessa muodossa 10 min (vanha 30 min koskee vain vanhoja ajoja).
- **Talvitihennys**: muina tasatunteina haetaan vain kamerat, joiden lähimmällä asemalla on silloin lunta, jäätä,
  kuuraa tai sohjoa (optinen koodi 5, 6, 7, 9) tai tienpinta −2…+2 °C. Katto 250 kuvaa per hetki, lumi/jää/kuura ensin.
  Juuri nämä luokat puuttuvat opetusdatasta. Testipäivänä (10.–11.11.) talvihetkissä oli 47–147 kuvaa.
- **Tyhjäkin talvihetki tallennetaan** (manifest + anturit, ei kuvia), jotta sitä ei tarkisteta joka tunti uudelleen
  eikä Digitrafficia kuormiteta turhaan (~390 asemahakua per tarkistus).
- **Ennusteet** eivät ole historiassa: ne haetaan ajohetkeltä ja tallennetaan ajon uusimpaan tiedostoon
  (`forecastsFetchedAt`). Niiden väli siis vaihtelee edelleen ajojen mukaan; 3 päivän riskimallille riittää.
- **Tiedostomuoto 2**: `<keruuhetki>.tar`, manifestissa `format`, `slot`, `kind` (grid/winter) ja `collectedAt`.
  Vanhat tiedostot pysyvät käyttökelpoisina: `labels.py`, `count.py` ja `peek.py` lukevat molempia. Vanhan muodon ajo
  alle 30 min päässä ruudukkohetkestä kattaa sen, ettei siirtymässä synny tuplia.

**Datamäärä**: ruudukko ~40 Mt × 8 = 320 Mt/pv, talvitihennys testipäivänä ~100 Mt/pv, katon kanssa enintään ~200 Mt/pv.
Talvi (~140 pv): noin 60 Gt, pahimmillaan ~73 Gt, eli alle Hugging Facen 100 Gt:n. Ajo: ~1 min ja ~0,9 Gt muistia
täydellä kamerajoukolla ennen kuvien latausta; ensimmäinen ajo voi hakea ~23 h kerralla, joten aikaraja nostettiin 40 min:iin.

**Jätettiin:**
- *Kuvat tunnin välein kaikista kameroista*: ~115 Gt talvessa, yli tilan, ja peräkkäiset kuvat samasta kamerasta ovat
  lähes samoja. Tihennys kohdistetaan sinne, missä harvinaiset luokat ovat.
- *Ulkoinen ajastin tai itseään käynnistävä työnkulku*: tarpeeton, kun historia paikkaa pudonneet ajot.
- *Kaikkien kuvakulmien keruu*: ennallaan, yksi kulma per kamera (tienpinta, jos on).

**Riski**: jos GitHub ei käynnistä yhtään ajoa ~23 tuntiin, väliin jäävät hetket menetetään. Seurataan tiedostojen
väleistä; varasuunnitelma on edelleen ulkoinen ajastin.

## 2026-11-11 · UI-kierros 1: hajota käyttöliittymä

**Menetelmä:** `tools/break_ui.py` rakentaa sivusta neljä versiota pahimman tapauksen datalla (oikeat sijainnit,
muokattu sisältö): ylipitkät nimet ja varoitukset, 30 varoitusta ja 169 liukastuvaa kameraa (*pitkat*), ei yhtään
mittausta (*tyhja*), kaikki jäässä (*jaa*) sekä kuvat ja kuvahistoria rikki (*rikki*). Kuvat kolmella leveydellä:
1600 px, 390 px ja uusi 320 px (`SHOT_NARROW=1`).

**Mikä hajosi ja korjaus:**
- **Päivitysaika rivittyi puhelimessa kolmelle riville** ("11.11. / klo / 10.24") myös tavallisella 390 px:n
  puhelimella suomeksi. Nyt ei rivity, ja puhelimessa näytetään pelkkä kellonaika, jos data on samalta päivältä.
- **Liukastumassa-listan pitkä nimi vei viisi riviä**, ja 320 px:n näkymään mahtui yksi kohde. Nimi katkaistaan
  kahteen riviin.
- **Aikajanan aikamerkinnät törmäsivät** 320 px:ssä. Kapealla näytöllä merkintöjä on kolme viiden sijaan.
- **Pitkä varoitusotsikko vei neljä riviä 22 px:n fontilla.** Yli 40 merkin otsikko näytetään 17 px:nä.
- **Tyhjä aikajana ei kertonut mitään.** Nyt siinä lukee "Ei mittaushistoriaa", eikä tyhjiä aikamerkintöjä näytetä.
- **Puuttuva kuva näytti selaimen rikkinäisen kuvan.** Nyt paneelissa lukee "Kuva ei ole saatavilla".
- Pienet: "(7 min)" rivittyi kahtia; numeron ja yksikön väliin sitova välilyönti.

**Kestivät:** pitkät nimet kamerapaneelissa (rivittyvät siististi), 30 varoituksen lista (vierittyy), kaikki jäässä
-tila, tyhjä Liukastumassa-lista (selittävä teksti).

**Samassa erässä keräimeen:** ensimmäinen pilviajo 11.11. haki 20 keruuhetkeä (4 940 kuvaa, 275 s). Kuvapalvelin
katkaisi muutaman siirron kesken, joten kuvahakuun lisättiin kaksi uudelleenyritystä.

## 2026-11-11 · UI-kierros 2: persoona-arviot

**Menetelmä:** viisi itsenäistä agenttia, kukin yhtenä käyttäjänä, käytti paikallista sivua kuvakaappausten kautta
ja raportoi pisteet ja löydökset: työmatka-autoilija (puhelin, 60 s), kuljetusyrityksen ajojärjestelijä (työpöytä,
yön reitit), tienpitourakoitsijan päivystäjä (Vaasa–Seinäjoki klo 3), rekrytoiva design lead (2 min, englanti) ja
heikkonäköinen käyttäjä (200 % zoom, VoiceOver, puna-vihersokeus).

**Korjattiin (usean persoonan yhteiset ensin):**
- **Kamerapaneeli ei siirtänyt karttaa** (3 persoonaa). Nyt kartta liukuu kameraan, puhelimessa paneelin yläpuolelle.
- **Varoituslistassa näkyi vain alue** (3). Rivillä on nyt varoitustekstin ensimmäinen lause.
- **Reitin varoitusrivi laski myös lauantain varoitukset "reitille osuviksi"**. Nyt erotellaan voimassa nyt tai
  12 h sisällä ja myöhemmin alkavat.
- **Reitin tulos:** "Liukasta 2 kohdassa" punaisella, vaikka kyse oli lumesta → luokan nimi ja väri ("Lunta tai sohjoa
  2 kohdassa"); "ei lunta eikä jäätä" -rivi kertoo myös märät kohdat ja on pahimman luokan värinen; pisin
  mittaamaton väli kilometreinä (Oulu–Kuopio: n. 250 km), ettei harmaa väli näytä turvalliselta; "n. 0 h 24 min" →
  "n. 24 min"; viimeisin reitti muistetaan ja avautuu yhdellä napautuksella.
- **Jää näkyy värisokealle**: jää/kuura-pisteillä valkoinen reunus (jää #ff4766 ja kuiva #34c77b näyttävät
  deuteranopiassa lähes samalta). "Ei mittausta" -harmaa vaaleammaksi (#5b6573 → #7d8794, kontrasti yli 3:1).
- **Ruudunlukija:** kartalta pois `role="application"`; paneelista pois koko paneelin ääneen lukeva `aria-live`;
  avattaessa kohdistus siirtyy paneelin otsikkoon ja sulkiessa takaisin; suljettu paneeli on `inert`; välilehdille
  nuolinäppäimet ja kiertävä tabindex. Alle 12 px:n tekstit 12 px:iin. Keskileveällä näytöllä (myös 200 % zoom)
  kortti ei jää aikajanan alle.
- **Projektin tarkoitus näkyviin** (design lead): selite kartan yläreunaan, "kuudelta kamerasta kymmenestä mittaus
  puuttuu: niille opetan tekoälyä…". Harmaan kameran tila ei enää lupaa "Tekoälyarvio tulossa" (luki keskeneräiseltä),
  vaan "Ei anturia lähellä · katso kamerakuva".
- **Tiet-välilehti**: mukana kaikki tiet, joilla on vähintään 3 kameraa (ennen 3 *mitattua*; päivystäjän tiet 18 ja 19
  puuttuivat). Nauhan päissä kunnat "Tien alku/loppu" -tekstin sijaan.
- **Pienet:** kameran otsikon toisto ("Tie 51 Inkoo / Tie 51 · Inkoo") poistettu; kuvakulman nimi englanniksi;
  aikajanan "Nyt" näkyi kahdesti.

**Löydös datasta:** Mustasaaren asema 10003 ilmoittaa optisella anturilla jäätä (koodi 7), mutta jäätä on 0,02 mm ja
kitka 0,80, eikä asemalla ole tienpinnan lämpöanturia. Kyse ei ole sivun virheestä. Paneeli kertoo nyt: "Anturi näkee
ohuen kerroksen (0,02 mm), mutta kitka on vielä hyvä." **Avoin päätös:** pitäisikö opetusdatassa jää/kuura-luokka
vaatia myös kitkan laskua tai jään vähimmäismäärää, ettei malli opi "jääksi" kuivalta näyttäviä kuvia?

**Ei tehty vielä (ehdotuksina):** kamerahaku nimellä (näppäimistö- ja ruudunlukijakäyttäjille ainoa tapa päästä
kameraan suoraan); Liukastumassa-listan rajaus näkyvään alueeseen tai reittiin; kitka ja tien lämpötila listariveille;
reittikohtainen muutos viime tunteina; varoitukset ryhmiteltyinä nyt / 12 h / myöhemmin myös karttavälilehdellä.

## 2026-11-11 · UI-kierros 3: Lighthouse-silmukka

**Menetelmä:** Lighthouse 12 (mobiili ja työpöytä) paikalliselle sivulle, korjaus, uusi mittaus, kunnes luvut eivät
parane. Paikallinen palvelin ei pakkaa tiedostoja, joten luvut ovat GitHub Pagesia (gzip) varovaisempia.

| | Suorituskyky | Saavutettavuus | Parhaat käytännöt | SEO |
|---|---:|---:|---:|---:|
| Mobiili, ennen | 82 | 90 | 100 | 100 |
| Mobiili, jälkeen | **100** | **100** | 100 | 100 |
| Työpöytä, ennen | 87 | 96 | 100 | 100 |
| Työpöytä, jälkeen | **100** | **100** | 100 | 100 |

Mobiilin ensimmäinen piirto 3,6 s → 0,8 s, LCP 3,6 s → 1,5 s. Työpöydän CLS 0,178 → 0,015, LCP 1,5 s → 0,2 s.

**Korjaukset:**
- **MapLibre ja sivun skripti estivät ensimmäisen piirron** (arvio 2,7 s mobiilissa). Sivun skripti siirrettiin
  tiedostoon `site/app.js`, ja molemmat ladataan `defer`-skripteinä (järjestys säilyy, funktiot pysyvät globaaleina,
  joten kuvakaappaus- ja testityökalut toimivat ennallaan). Kartan CSS ja fontti ladataan piirtoa estämättä.
- **Esiyhteydet** kuvapalvelimelle, karttaruutuihin ja fontteihin.
- **Asettelun hyppy:** varoituslista ja lähdetiedot siirsivät korttia, kun data latautui. Ne pysyvät näkymättöminä
  latauksen ajan, ja selitteelle varataan korkeus.
- **LCP-elementti** oli kartan selitysteksti, joka kirjoitettiin vasta skriptissä. Suomenkielinen teksti on nyt
  valmiina HTML:ssä.
- **Saavutettavuus:** pienennä-painikkeelta ja aikajanan liukusäätimeltä puuttui nimi.

**Ei korjattu:** MapLibren käyttämätön koodi (~130 kt) ja vanhan JS:n tuki kuuluvat kirjastoon; oma koonti ei ole
vaivan arvoinen staattisella sivulla. Tiedostojen pakkaus ja välimuistiaika ovat GitHub Pagesin hallussa.
