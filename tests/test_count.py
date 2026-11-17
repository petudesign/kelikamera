from count import MAX_KM, READY_CAMERAS, count


def summary(items, kind="grid"):
    return {"kind": kind, "items": items}


def it(camera, cls, km=1.0, thin=False, surface=True, ir=False):
    return {"camera": camera, "class": cls, "km": km, "thin": thin, "surface": surface, "ir": ir,
            "friction": 0.5, "reason": None if cls else "ei optista anturia"}


def test_counts_distinct_cameras_and_applies_rules():
    r = count([summary([it("A", "jää/kuura"), it("A", "jää/kuura"), it("B", "jää/kuura", thin=True),
                        it("C", "jää/kuura", km=MAX_KM + 1), it("D", None), it("E", "kuiva", surface=False)])])
    ice = r["classes"]["jää/kuura"]
    assert ice["images"] == 2 and ice["cameras"] == 1 and ice["thin_cameras"] == 1
    assert r["rejected"] == {f"asema yli {MAX_KM:g} km": 1, "ei optista anturia": 1, "ei tienpintakulma": 1}


def test_ready_when_enough_distinct_cameras():
    r = count([summary([it(f"K{i}", "kuiva") for i in range(READY_CAMERAS)])])
    assert r["classes"]["kuiva"]["ready"] and not r["classes"]["märkä"]["ready"]
