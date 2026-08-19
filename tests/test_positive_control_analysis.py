"""The analysis has to agree with the app it is checking, or it checks nothing.

Two of these tests pin numbers against the TypeScript they mirror: the panel
geometry and the cue verdict. If either side moves, they fail here rather than
quietly producing a different table.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from analyze_positive_control import (
    GEOPREF_THRESHOLD,
    Session,
    composite_table,
    geometric_side,
    project_geopref_aoi,
    session_hash,
    sign_test_p,
    signal_statuses,
)

ROOT = Path(__file__).resolve().parent.parent
SUMMARY = ROOT / "research" / "hasil" / "kontrol_positif" / "ringkasan.json"


def test_session_hash_matches_the_typescript_it_mirrors():
    # app/src/geopref/protocol.ts sessionHash, checked on the identity every
    # recording in the positive-control set carried.
    assert session_hash("GA-20260819-01") % 2 == 1
    assert geometric_side("GA-20260819-01") == "right"
    assert geometric_side("KP-02") == "left"


def test_panels_stay_glued_to_the_clip_when_the_stage_is_letterboxed():
    # A stage narrower than the clip letterboxes it vertically; the AOIs have to
    # move with the picture, not stay stuck to the viewport.
    boxes = project_geopref_aoi(1.88)
    left, right = boxes["left"], boxes["right"]
    assert left[2] > 0 and left[3] < 1, "letterbox harus memotong rentang vertikal"
    assert left[1] < right[0], "panel tidak boleh bertumpang tindih"
    # A stage matching the clip needs no letterbox at all.
    square = project_geopref_aoi(384 / 122)
    assert square["left"][2] == pytest.approx(0.0)
    assert square["left"][3] == pytest.approx(1.0)


def test_sign_test_matches_the_app():
    # app/src/inference/jointAttention.ts signTestPValue. Seven of eight is the
    # threshold case the comment there turns on.
    assert sign_test_p(8, 8) == pytest.approx(1 / 256)
    assert sign_test_p(7, 8) == pytest.approx(9 / 256)
    assert sign_test_p(6, 8) > 0.05


def build(**overrides) -> Session:
    defaults = dict(
        file="kp-x-produksi-1.json", device="x", condition="produksi", attempt=1,
        child_id="KP-X", session_id="s", created_at="2026-08-19T12:00:00.000Z",
        viewport_aspect=1.88, calibration_error_deg=1.2, face_rate=1.0,
        gaze_dropout=0.02, gaze_saturation=0.01, geometric_side="right",
        geopref_percent=0.95, geopref_aoi_coverage=0.9, geopref_valid_samples=300,
        cue_trials_scored=8, cue_trials_followed=0, cue_trials_entering_target=0,
        cue_attended_at_cue=6, centre_hold_iqr=0.04, saturation_by_epsilon={},
        withheld_reasons=[],
    )
    return Session(**{**defaults, **overrides})


def test_the_produced_pattern_deviates_on_both_signals():
    statuses = signal_statuses(build())
    assert statuses == {"geometric_preference": "menyimpang", "cue_following": "menyimpang"}


def test_a_floor_without_attendance_is_not_counted_as_deviant():
    # Same flat cue trace, but nothing shows the participant looking at the model
    # when the cue landed — which is what a vertical calibration offset produces.
    statuses = signal_statuses(build(cue_attended_at_cue=2))
    assert statuses["cue_following"] == "tidak_dapat_dinilai"


def test_ordinary_viewing_below_the_published_cutoff_reads_as_normal():
    statuses = signal_statuses(build(
        condition="biasa", geopref_percent=GEOPREF_THRESHOLD - 0.01,
        cue_trials_followed=7, cue_trials_entering_target=8, cue_attended_at_cue=4,
    ))
    assert statuses == {"geometric_preference": "normal", "cue_following": "normal"}


def test_one_deviant_signal_never_fires_the_composite():
    # The whole point of a threshold of two. A single high geometric-preference
    # reading in ordinary viewing must not reach the rule on its own.
    table = composite_table([build(
        condition="biasa", geopref_percent=0.73,
        cue_trials_followed=7, cue_trials_entering_target=8, cue_attended_at_cue=4,
    )])
    assert table["biasa"]["menyala"] == 0


@pytest.mark.skipif(not SUMMARY.exists(), reason="jalankan research/analyze_positive_control.py dulu")
def test_published_summary_never_claims_more_than_it_measured():
    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    # The shipped rule cannot fire, and the summary has to keep saying so even
    # after the demonstration numbers land next to it.
    assert summary["compositeRule"]["asShipped"]["fired"] == {"biasa": 0, "produksi": 0}
    # Ordinary viewing is the cell that matters. If it stops being zero the rule
    # is too loose and the number has to be published rather than tuned away —
    # but it must never be published without anybody noticing it moved.
    assert summary["compositeRule"]["demonstrasi"]["fired"]["biasa"] == 0
    assert summary["sensitivityModel"]["grouping"].startswith("perangkat")
    assert summary["pairingRecoverable"] is False
    assert "bukan sensitivitas" in summary["scope"].lower()
    # Attrition is data. A withheld session that disappeared from the count
    # would make the quality criteria look free.
    for condition, counts in summary["attritionByCondition"].items():
        assert counts["direkam"] == counts["dipakai"] + counts["ditahan"], condition
