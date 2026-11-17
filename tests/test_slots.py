from datetime import datetime, timedelta, timezone

from slots import kind_of, lost_slots, missing_slots, nearest, parse_stamp, slot_times, snapshot, winter_rank

UTC = timezone.utc
NOW = datetime(2026, 11, 17, 12, 30, tzinfo=UTC)


def at(h, m=0, day=17):
    return datetime(2026, 11, day, h, m, tzinfo=UTC)


def test_slot_times_cover_history_window_hourly():
    slots = slot_times(NOW)
    assert slots[0] == at(15, day=16) and slots[-1] == at(12)
    assert all(b - a == timedelta(hours=1) for a, b in zip(slots, slots[1:]))


def test_grid_every_third_hour():
    assert kind_of(at(0)) == kind_of(at(3)) == "grid"
    assert kind_of(at(4)) == "winter"


def test_missing_slots_skip_saved_ones():
    have = [at(12), at(11)]
    missing = missing_slots(NOW, have)
    assert at(12) not in missing and at(11) not in missing and at(9) in missing


def test_old_format_run_covers_nearby_grid_slot_only():
    have = [at(6, 21)]
    missing = missing_slots(NOW, have)
    assert at(6) not in missing
    assert at(7) in missing  # talvihetki vaatii tarkan osuman


def test_lost_slots_are_grid_slots_beyond_history():
    have = [at(12, day=16)]
    lost = lost_slots(NOW, have)
    assert lost == [at(9, day=16)]


def test_parse_stamp_ignores_other_files():
    assert parse_stamp("20261117T0300Z.tar") == at(3)
    assert parse_stamp("20261117T0300Z.labels.json") is None


def test_nearest_within_tolerance():
    series = [(at(10, 0), "a"), (at(10, 10), "b"), (at(10, 20), "c")]
    assert nearest(series, at(10, 12), timedelta(minutes=5)) == (at(10, 10), "b")
    assert nearest(series, at(11, 0), timedelta(minutes=10)) is None
    assert nearest([], at(10), timedelta(minutes=10)) is None


def test_snapshot_keeps_only_close_values():
    series = {"TIE_1": [(at(10, 0), -1.0)], "ILMA": [(at(9, 0), 2.0)]}
    snap = snapshot(series, at(10, 3), timedelta(minutes=10))
    assert snap == {"TIE_1": {"value": -1.0, "measuredTime": at(10).isoformat()}}


def test_winter_rank_prefers_snow_and_ice_over_temperature():
    assert winter_rank({"OPTISEN_ANTURIN_KELI1": {"value": 7}}) == 0
    assert winter_rank({"OPTISEN_ANTURIN_KELI1": {"value": 3}, "TIE_1": {"value": 0.5}}) == 1
    assert winter_rank({"OPTISEN_ANTURIN_KELI1": {"value": 1}, "TIE_1": {"value": 6.0}}) is None
