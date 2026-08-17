import pandas as pd

from validate_study_tables import validate_table


def test_gate_c_rejects_child_and_site_leakage():
    common = {"visit_id": "v1", "session_id": "s1", "device_id": "d1", "age_months": 24, "quality_passed": True, "abstain_reason": "", "mchat_score": 1, "reference_outcome": 0}
    frame = pd.DataFrame([
        {**common, "child_id": "c1", "site_id": "A", "partition": "development"},
        {**common, "child_id": "c1", "site_id": "A", "partition": "external"},
    ])
    errors = validate_table(frame, "gateC")
    assert "child leakage across partitions" in errors
    assert "external site appears in development" in errors


def test_gate_d_rejects_duplicate_modality_rows():
    frame = pd.DataFrame([
        {"child_id": "c1", "visit_id": "v1", "session_id": "s1", "fold": 0, "modality": "gaze", "oof_probability": .2, "quality": .9, "label": 0},
        {"child_id": "c1", "visit_id": "v1", "session_id": "s1", "fold": 0, "modality": "gaze", "oof_probability": .3, "quality": .8, "label": 0},
    ])
    assert "duplicate modality prediction within paired session" in validate_table(frame, "gateD")
