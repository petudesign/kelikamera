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

## Avoimet kysymykset

- **Mitä `TIENPINNAN_TILA_1`:n koodit tarkoittavat?** Rajapinta ei anna selitteitä. Havaitut arvot: 0, 1, 2, 3, 10, 11.
  Samoin `OPTISEN_ANTURIN_KELI1` (havaitut 1, 2, 3, 6, 7, 9). Selvitettävä Digitrafficin dokumentaatiosta tai
  Fintrafficilta ennen koulutusta.
- Kuinka kaukana kamerat keskimäärin ovat asemistaan, ja paljonko se heikentää tunnisteita?
- Kannattaako keruuta tihentää, kun keli muuttuu nopeasti (esim. lämpötila nollan tuntumassa)?
