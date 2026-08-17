import hashlib
import json

from gate_evidence_repository import build_manifest, canonical_filename, gate_a_summary, migrate_evidence, verify_manifest


def test_canonical_filename_only_removes_archive_bug_prefix():
    assert canonical_filename("users_neurogaze-audit-abc.json") == "neurogaze-audit-abc.json"
    assert canonical_filename("neurogaze-audit-abc.json") == "neurogaze-audit-abc.json"


def test_migration_preserves_raw_bytes_and_records_hashes(tmp_path):
    source = tmp_path / "_incoming"
    session_dir = source / "gate_a" / "sesi"
    pair_dir = source / "gate_b" / "pasangan"
    session_dir.mkdir(parents=True)
    pair_dir.mkdir(parents=True)
    session_bytes = b'{"schemaVersion":3,"events":[]}\r\n'
    pair_bytes = b'{"schema":"neurogaze-webgazer-comparison-v3"}\n'
    (session_dir / "users_neurogaze-audit-one.json").write_bytes(session_bytes)
    (pair_dir / "gate-b-comparison-one.json").write_bytes(pair_bytes)

    destination = tmp_path / "hasil"
    manifest = migrate_evidence(source, destination)

    migrated_session = destination / "gate_a" / "sesi" / "neurogaze-audit-one.json"
    migrated_pair = destination / "gate_b" / "pasangan" / "gate-b-comparison-one.json"
    assert migrated_session.read_bytes() == session_bytes
    assert migrated_pair.read_bytes() == pair_bytes
    assert manifest["files"][0]["sha256"] == hashlib.sha256(session_bytes).hexdigest()
    assert verify_manifest(destination / "evidence_manifest.json") == []
    assert not source.exists()


def test_manifest_verification_detects_tampering(tmp_path):
    evidence = tmp_path / "hasil"
    evidence.mkdir()
    payload = evidence / "gate_a.json"
    payload.write_bytes(b"original")
    manifest = {
        "schema": "neurogaze-evidence-manifest-v1",
        "files": [{"canonicalPath": "gate_a.json", "bytes": 8, "sha256": hashlib.sha256(b"original").hexdigest()}],
    }
    manifest_path = evidence / "evidence_manifest.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    payload.write_bytes(b"changed")

    errors = verify_manifest(manifest_path)

    assert errors
    assert "gate_a.json" in errors[0]


def test_manifest_can_be_rebuilt_from_canonical_evidence(tmp_path):
    evidence = tmp_path / "hasil"
    session = evidence / "gate_a" / "sesi" / "session.json"
    pair = evidence / "gate_b" / "pasangan" / "pair.json"
    session.parent.mkdir(parents=True)
    pair.parent.mkdir(parents=True)
    session.write_bytes(b"gate-a")
    pair.write_bytes(b"gate-b")

    manifest = build_manifest(evidence)

    assert [entry["canonicalPath"] for entry in manifest["files"]] == [
        "gate_a/sesi/session.json",
        "gate_b/pasangan/pair.json",
    ]
    assert verify_manifest(evidence / "evidence_manifest.json") == []


def test_gate_a_quality_metrics_use_completed_sessions(tmp_path):
    common = {
        "schemaVersion": 3,
        "purpose": "gate_a_adult",
        "profile": {"participantId": "P1"},
        "device": {"deviceId": "D1"},
        "calibration": {"warnings": []},
        "assessment": {"riskScoreEmitted": False, "extractionP90Ms": 7.67},
    }
    records = [
        {**common, "quality": {"passed": True, "calibrationErrorDeg": 2.2, "faceRate": 0.964, "gazeDropout": 0.036}},
        {**common, "quality": {"passed": False, "calibrationErrorDeg": None, "faceRate": 0.2, "gazeDropout": 0.8}},
    ]
    paths = []
    for index, record in enumerate(records):
        path = tmp_path / f"{index}.json"
        path.write_text(json.dumps(record), encoding="utf-8")
        paths.append(path)

    summary = gate_a_summary(paths)

    assert summary["meanValidFrameRate"] == 0.964
    assert summary["meanGazeDropout"] == 0.036
