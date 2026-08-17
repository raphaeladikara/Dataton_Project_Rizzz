"""Normalize and verify original Neurogaze Gate A/B browser exports.

Raw JSON payloads are moved byte-for-byte. Only the known archive-layer
``users_`` filename prefix is removed; measurement fields are never rewritten.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from statistics import mean, median
from typing import Any

import numpy as np

from analyze_gate_b import load_pairs, summarize


MANIFEST_SCHEMA = "neurogaze-evidence-manifest-v1"


def canonical_filename(name: str) -> str:
    return name.removeprefix("users_")


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _inside(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def build_manifest(destination_root: Path) -> dict[str, Any]:
    destination_root = destination_root.resolve()
    paths = sorted((destination_root / "gate_a" / "sesi").glob("*.json"))
    paths.extend(sorted((destination_root / "gate_b" / "pasangan").glob("*.json")))
    if not paths:
        raise ValueError(f"No canonical evidence JSON found below {destination_root}")
    entries = []
    for path in paths:
        payload = path.read_bytes()
        entries.append(
            {
                "canonicalPath": path.relative_to(destination_root).as_posix(),
                "bytes": len(payload),
                "sha256": _sha256(payload),
            }
        )
    manifest = {
        "schema": MANIFEST_SCHEMA,
        "policy": "canonical raw JSON is preserved byte-for-byte and verified with SHA-256",
        "files": entries,
    }
    (destination_root / "evidence_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return manifest


def migrate_evidence(source_root: Path, destination_root: Path) -> dict[str, Any]:
    source_root = source_root.resolve()
    destination_root = destination_root.resolve()
    if source_root == destination_root or not source_root.is_dir():
        raise ValueError(f"Invalid evidence source: {source_root}")

    groups = (
        ("gate_a", "sesi", "*.json"),
        ("gate_b", "pasangan", "*.json"),
    )
    moves: list[tuple[Path, Path, bytes]] = []
    for gate, folder, pattern in groups:
        source_dir = source_root / gate / folder
        for source in sorted(source_dir.glob(pattern)):
            destination = destination_root / gate / folder / canonical_filename(source.name)
            if not _inside(destination, destination_root):
                raise ValueError(f"Destination escapes evidence root: {destination}")
            payload = source.read_bytes()
            if destination.exists() and destination.read_bytes() != payload:
                raise FileExistsError(f"Conflicting evidence file: {destination}")
            moves.append((source, destination, payload))

    if not moves:
        raise ValueError(f"No raw evidence JSON found below {source_root}")

    entries: list[dict[str, Any]] = []
    for source, destination, payload in moves:
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            source.unlink()
        else:
            source.replace(destination)
        migrated = destination.read_bytes()
        if migrated != payload:
            raise RuntimeError(f"Byte verification failed after moving {source}")
        entries.append(
            {
                "sourcePath": source.relative_to(source_root).as_posix(),
                "canonicalPath": destination.relative_to(destination_root).as_posix(),
                "bytes": len(payload),
                "sha256": _sha256(payload),
            }
        )

    manifest = {
        "schema": MANIFEST_SCHEMA,
        "policy": "raw JSON preserved byte-for-byte; only known archive filename prefix normalized",
        "files": entries,
    }
    manifest_path = destination_root / "evidence_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Summaries are always regenerated from the canonical raw records.
    for name in ("gate_a/gate_a_summary.json", "gate_b/gate_b_public_evidence.json"):
        candidate = source_root / name
        if candidate.is_file():
            candidate.unlink()
    for directory in sorted((path for path in source_root.rglob("*") if path.is_dir()), reverse=True):
        if not any(directory.iterdir()):
            directory.rmdir()
    if source_root.exists() and not any(source_root.iterdir()):
        source_root.rmdir()
    return manifest


def verify_manifest(manifest_path: Path) -> list[str]:
    manifest_path = manifest_path.resolve()
    value = json.loads(manifest_path.read_text(encoding="utf-8"))
    if value.get("schema") != MANIFEST_SCHEMA:
        return [f"Unsupported manifest schema in {manifest_path}"]
    root = manifest_path.parent
    errors: list[str] = []
    for entry in value.get("files", []):
        relative = str(entry.get("canonicalPath", ""))
        path = (root / relative).resolve()
        if not _inside(path, root) or not path.is_file():
            errors.append(f"Missing or unsafe evidence path: {relative}")
            continue
        payload = path.read_bytes()
        if len(payload) != entry.get("bytes") or _sha256(payload) != entry.get("sha256"):
            errors.append(f"Hash or size mismatch: {relative}")
    return errors


def gate_a_summary(paths: list[Path]) -> dict[str, Any]:
    logs = [json.loads(path.read_text(encoding="utf-8")) for path in paths]
    if any(log.get("schemaVersion") != 3 or log.get("purpose") != "gate_a_adult" for log in logs):
        raise ValueError("Gate A evidence must use schemaVersion 3 and purpose gate_a_adult")
    passed = [log for log in logs if (log.get("quality") or {}).get("passed") is True]
    participants = {str((log.get("profile") or {}).get("participantId")) for log in logs}
    devices = {str((log.get("device") or {}).get("deviceId")) for log in logs}
    calibration = [float(log["quality"]["calibrationErrorDeg"]) for log in passed]
    face_rates = [float(log["quality"]["faceRate"]) for log in passed]
    dropouts = [float(log["quality"]["gazeDropout"]) for log in passed]
    extraction = [float(log["assessment"]["extractionP90Ms"]) for log in logs if (log.get("assessment") or {}).get("extractionP90Ms") is not None]
    warnings = Counter(
        warning
        for log in logs
        for warning in ((log.get("calibration") or {}).get("warnings") or [])
    )
    return {
        "schema": "neurogaze-gate-a-summary-v2",
        "source": "derived_from_original_browser_exports",
        "sessions": len(logs),
        "participants": len(participants),
        "devices": len(devices),
        "passed": len(passed),
        "completionRate": len(passed) / len(logs),
        "medianCalibrationErrorDeg": float(median(calibration)),
        "meanValidFrameRate": float(mean(face_rates)),
        "meanGazeDropout": round(float(mean(dropouts)), 4),
        "extractionP90Ms": float(np.quantile(extraction, 0.9, method="higher")) if extraction else None,
        "failureWarnings": dict(warnings),
        "riskScoresEmitted": sum(bool((log.get("assessment") or {}).get("riskScoreEmitted")) for log in logs),
        "interpretation": "Gate A measures device/session quality in adults, not ASD diagnostic accuracy.",
    }


def gate_b_summary(paths: list[Path]) -> dict[str, Any]:
    pairs = load_pairs(paths)
    result = summarize(pairs)
    if result.get("schema") == "neurogaze-webgazer-cohort-summary-v3":
        return result
    ready = [pair for pair in pairs if pair.get("status") == "comparison_ready"]
    result.update(
        {
            "source": "derived_from_original_browser_exports",
            "medianOfPairP90ErrorDeg": float(median(float(pair["p90ErrorDeg"]) for pair in ready)),
            "referenceDevice": {"model": "not_recorded_in_raw_export", "samplingHz": None},
            "metricDefinitionNote": "medianOfPairP90ErrorDeg and p90OfPairMedianErrorDeg summarize different per-pair statistics.",
        }
    )
    return result


def write_summaries(destination_root: Path) -> None:
    gate_a_paths = sorted((destination_root / "gate_a" / "sesi").glob("*.json"))
    gate_b_paths = sorted((destination_root / "gate_b" / "pasangan").glob("*.json"))
    (destination_root / "gate_a" / "gate_a_summary.json").write_text(
        json.dumps(gate_a_summary(gate_a_paths), indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (destination_root / "gate_b" / "gate_b_summary.json").write_text(
        json.dumps(gate_b_summary(gate_b_paths), indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("research/hasil/_incoming"))
    parser.add_argument("--destination", type=Path, default=Path("research/hasil"))
    parser.add_argument("--migrate", action="store_true")
    parser.add_argument("--rebuild", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.migrate:
        manifest = migrate_evidence(args.source, args.destination)
        write_summaries(args.destination)
        print(f"Migrated {len(manifest['files'])} raw evidence files.")
    if args.rebuild:
        write_summaries(args.destination)
        manifest = build_manifest(args.destination)
        print(f"Rebuilt summaries and manifest for {len(manifest['files'])} evidence files.")
    if args.verify:
        errors = verify_manifest(args.destination / "evidence_manifest.json")
        if errors:
            raise SystemExit("\n".join(errors))
        print("Evidence manifest verified.")
    if not args.migrate and not args.rebuild and not args.verify:
        parser.error("choose --migrate, --rebuild, and/or --verify")


if __name__ == "__main__":
    main()
