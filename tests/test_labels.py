from labels import label


def item(code, friction=0.8, ice=0.0, snow=0.0, img="2026-11-17T03:00:00+00:00", sensor="2026-11-17T03:02:00+00:00"):
    s = lambda v: {"value": v, "measuredTime": sensor}  # noqa: E731
    return {"measuredTime": img, "sensors": {"OPTISEN_ANTURIN_KELI1": s(code), "KITKA1_LUKU": s(friction),
                                             "JÄÄN_MÄÄRÄ1": s(ice), "LUMEN_MÄÄRÄ1": s(snow)}}


def test_optical_codes_map_to_classes():
    assert label(item(1), {})["class"] == "kuiva"
    assert label(item(4), {})["class"] == "märkä"  # märkä ja suolattu → märkä
    assert label(item(7, friction=0.1, ice=1.8), {})["class"] == "jää/kuura"


def test_fault_code_is_rejected_with_reason():
    out = label(item(0), {})
    assert out["class"] is None and out["reason"].startswith("koodi 0")


def test_thin_layer_flagged_but_class_kept():
    out = label(item(7, friction=0.8, ice=0.02), {})
    assert out["class"] == "jää/kuura" and out["thin"]
    assert not label(item(7, friction=0.3, ice=0.02), {})["thin"]
    assert not label(item(7, friction=0.8, ice=0.5), {})["thin"]


def test_sensor_far_from_image_time_is_rejected():
    out = label(item(1, sensor="2026-11-17T03:20:00+00:00"), {})
    assert out["class"] is None and out["reason"] == "anturi ja kuva eri aikaan"


def test_missing_station_data():
    assert label({"measuredTime": None, "weatherStation": 1}, {})["reason"] == "ei asemadataa"
