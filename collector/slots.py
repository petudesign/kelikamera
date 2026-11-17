"""Keruuhetket ja aikasarjojen haku. Puhtaita funktioita: ei verkkoa, helppo testata.

Ruudukkohetki on joka 3. tasatunti UTC (kaikki kamerat), talvihetki muut tasatunnit (vain talviset kamerat).
Digitrafficin historia ulottuu ~23 h taakse, joten jokainen ajo täydentää puuttuvat hetket.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

SLOT_HOURS = 3
HISTORY_SPAN = timedelta(hours=22)        # historia ~23 h, tunti varmuusvaraa
SETTLE = timedelta(minutes=15)            # odotetaan, että myös hetken jälkeinen kuva on olemassa
OLD_RUN_COVERS = timedelta(minutes=30)    # vanhan muodon ajo (esim. 06:21) kattaa lähimmän ruudukkohetken
LOST_WINDOW = timedelta(hours=8)          # aukkotarkistus katsoo näin pitkälle historian taakse

WINTER_CODES = {5, 6, 7, 9}               # kuura, lumi, jää, sohjo (KELI-koodisto)
WINTER_ROAD_T = (-2.0, 2.0)               # tai tienpinta nollan tuntumassa (°C)


def stamp_of(t: datetime) -> str:
    return t.strftime("%Y%m%dT%H%MZ")


def parse_stamp(name: str) -> datetime | None:
    """'20261111T0300Z.tar' → aika; muut tiedostot (esim. .labels.json) → None."""
    if not name.endswith(".tar"):
        return None
    return datetime.strptime(name[:-4], "%Y%m%dT%H%MZ").replace(tzinfo=timezone.utc)


def kind_of(t: datetime) -> str:
    return "grid" if t.hour % SLOT_HOURS == 0 else "winter"


def slot_times(now: datetime) -> list[datetime]:
    """Historian kattamat tasatunnit vanhimmasta uusimpaan."""
    t = (now - HISTORY_SPAN).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    out = []
    while t <= now - SETTLE:
        out.append(t)
        t += timedelta(hours=1)
    return out


def _covered(t: datetime, have: list[datetime]) -> bool:
    if kind_of(t) == "grid":
        return any(abs(h - t) <= OLD_RUN_COVERS for h in have)
    return t in have


def missing_slots(now: datetime, have: list[datetime]) -> list[datetime]:
    return [t for t in slot_times(now) if not _covered(t, have)]


def lost_slots(now: datetime, have: list[datetime]) -> list[datetime]:
    """Ruudukkohetket, jotka ovat pudonneet historian ulkopuolelle ilman tiedostoa: ne on menetetty."""
    t = (now - HISTORY_SPAN).replace(minute=0, second=0, microsecond=0)
    lost = []
    while t >= now - HISTORY_SPAN - LOST_WINDOW:
        if kind_of(t) == "grid" and t < now - HISTORY_SPAN and not _covered(t, have):
            lost.append(t)
        t -= timedelta(hours=1)
    return sorted(lost)


def nearest(series: list[tuple], t: datetime, tol: timedelta):
    """Aikaa t lähin (aika, arvo) aikajärjestetystä sarjasta, tai None jos lähin on yli tol päässä."""
    i = _bisect(series, t)
    best = min((series[j] for j in (i - 1, i) if 0 <= j < len(series)), key=lambda x: abs(x[0] - t), default=None)
    return best if best and abs(best[0] - t) <= tol else None


def _bisect(series: list[tuple], t: datetime) -> int:
    """bisect_left aika-avaimella (bisectin key-parametri vaatii Python 3.10:n)."""
    lo, hi = 0, len(series)
    while lo < hi:
        mid = (lo + hi) // 2
        if series[mid][0] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo


def snapshot(series: dict[str, list[tuple]], t: datetime, tol: timedelta) -> dict[str, dict]:
    """Aseman kaikki anturit hetkellä t: {anturi: {value, measuredTime}} (lähin arvo, enintään tol päässä)."""
    out = {}
    for name, x in series.items():
        if hit := nearest(x, t, tol):
            out[name] = {"value": hit[1], "measuredTime": hit[0].isoformat()}
    return out


def winter_rank(snap: dict[str, dict]) -> int | None:
    """0 = optinen anturi näyttää lunta tai jäätä, 1 = tie nollan tuntumassa, None = ei talvinen."""
    code = (snap.get("OPTISEN_ANTURIN_KELI1") or {}).get("value")
    road = (snap.get("TIE_1") or {}).get("value")
    if code is not None and int(code) in WINTER_CODES:
        return 0
    if road is not None and WINTER_ROAD_T[0] <= road <= WINTER_ROAD_T[1]:
        return 1
    return None
