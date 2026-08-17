import json

from analyze_session_logs import analyze_logs, load_logs, render_markdown


def test_session_log_analysis_reports_calibration_failure(tmp_path):
    log = {
        "schemaVersion": 2,
        "sessionId": "s1",
        "mode": "live",
        "privacy": {"rawMediaStored": False, "rawLandmarksStored": False, "researchConsent": True},
        "quality": {"faceRate": 0.8, "gazeDropout": 0.3, "sampleCount": 80, "calibrationErrorDeg": 6.2},
        "events": [
            {"atMs": 10, "type": "calibration.fit_failed", "level": "error", "data": {"targetDiagnostics": [{"targetIndex": 0, "attempted": 20, "accepted": 5, "rejectedNoFace": 10, "rejectedEye": 3, "rejectedPose": 2, "dispersionU": 0.01, "dispersionV": 0.02}]}},
        ],
    }
    path = tmp_path / "audit.json"
    path.write_text(json.dumps(log), encoding="utf-8")
    logs, rejected = load_logs([path])
    report = analyze_logs(logs, rejected)
    assert report["sessions"] == 1
    assert report["failureEvents"]["calibration.fit_failed"] == 1
    assert report["calibrationTargets"]["0"]["acceptanceRate"] == 0.25
    assert "Calibration target acceptance" in render_markdown(report)


def test_session_log_analysis_deduplicates_cumulative_downloads(tmp_path):
    base = {
        "schemaVersion": 2,
        "sessionId": "same-session",
        "mode": "live",
        "privacy": {"rawMediaStored": False, "rawLandmarksStored": False, "researchConsent": True},
    }
    first = {**base, "events": [{"type": "calibration.passed", "level": "info", "data": {"errorDeg": 2.0}}]}
    latest = {
        **base,
        "events": [
            {"type": "calibration.passed", "level": "info", "data": {"errorDeg": 2.0}},
            {"type": "calibration.failed_validation", "level": "warning", "data": {"errorDeg": 7.0}},
        ],
    }
    (tmp_path / "first.json").write_text(json.dumps(first), encoding="utf-8")
    (tmp_path / "latest.json").write_text(json.dumps(latest), encoding="utf-8")
    logs, rejected = load_logs([tmp_path])
    report = analyze_logs(logs, rejected)
    assert report["sessions"] == 1
    assert report["calibrationAttempts"] == 2
    assert report["calibrationAttemptOutcomes"] == {"passed": 1, "failed": 1}
    assert report["metrics"]["calibrationErrorDeg"]["n"] == 2


def test_session_log_analysis_accepts_current_schema_v3(tmp_path):
    log = {
        "schemaVersion": 3,
        "sessionId": "gate-a-current",
        "mode": "live",
        "purpose": "gate_a_adult",
        "privacy": {"rawMediaStored": False, "rawLandmarksStored": False, "researchConsent": True},
        "events": [],
    }
    path = tmp_path / "neurogaze-audit-current.json"
    path.write_text(json.dumps(log), encoding="utf-8")

    logs, rejected = load_logs([path])

    assert len(logs) == 1
    assert rejected == []
    assert logs[0]["schemaVersion"] == 3
