"""Aggregate Neurogaze device-local audit logs for failure analysis.

The tool reads exported JSON logs only; it never needs or reconstructs video or
facial landmarks. It produces a machine-readable summary and a concise Markdown
report suitable for calibration/device review meetings.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from statistics import median
from typing import Any, Iterable


def _numbers(values: Iterable[Any]) -> list[float]:
    return [float(value) for value in values if isinstance(value, (int, float))]


def _summary(values: Iterable[Any]) -> dict[str, float | int | None]:
    clean = sorted(_numbers(values))
    if not clean:
        return {"n": 0, "median": None, "p90": None, "min": None, "max": None}
    p90_index = min(len(clean) - 1, max(0, round(0.9 * (len(clean) - 1))))
    return {
        "n": len(clean),
        "median": float(median(clean)),
        "p90": float(clean[p90_index]),
        "min": float(clean[0]),
        "max": float(clean[-1]),
    }


def load_logs(paths: Iterable[Path]) -> tuple[list[dict], list[dict]]:
    logs, rejected = [], []
    files: list[Path] = []
    for path in paths:
        files.extend(path.rglob("*.json") if path.is_dir() else [path])
    for path in sorted(set(files)):
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            if value.get("schemaVersion") not in {2, 3} or not isinstance(value.get("events"), list):
                raise ValueError("not a supported Neurogaze schemaVersion 2 or 3 audit log")
            if (
                value.get("purpose") == "target_population_research"
                and not bool((value.get("privacy") or {}).get("researchConsent"))
            ):
                raise ValueError("target_population_research log has no research consent; excluded from analysis")
            value["_source"] = str(path)
            logs.append(value)
        except Exception as exc:  # audit tools must report, not silently skip
            rejected.append({"path": str(path), "reason": str(exc)})
    # Operators may download the same in-memory audit repeatedly after retries.
    # Those files are cumulative snapshots, not independent sessions. Keep the
    # richest snapshot per sessionId to avoid inflating denominators and events.
    by_session: dict[str, dict] = {}
    for index, log in enumerate(logs):
        key = str(log.get("sessionId") or f"missing-session-{index}")
        current = by_session.get(key)
        if current is None or len(log.get("events", [])) > len(current.get("events", [])):
            by_session[key] = log
    return list(by_session.values()), rejected


def analyze_logs(logs: list[dict], rejected: list[dict] | None = None) -> dict:
    event_counts: Counter[str] = Counter()
    failures: Counter[str] = Counter()
    calibration_errors, face_rates, dropouts, sample_counts = [], [], [], []
    calibration_outcomes: Counter[str] = Counter()
    feature_coverage, ood_max_z, fps_values, battery_levels, phase_counts = [], [], [], [], []
    target_stats: dict[int, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    privacy_violations = []

    for log in logs:
        source = log.get("_source", log.get("sessionId", "unknown"))
        privacy = log.get("privacy", {})
        if privacy.get("rawMediaStored") is not False or privacy.get("rawLandmarksStored") is not False:
            privacy_violations.append(source)
        quality = log.get("quality") or {}
        device = log.get("device") or {}
        gaze = log.get("gaze") or {}
        ood = gaze.get("ood") or {}
        cue = gaze.get("cueFeatures") or {}
        calibration = log.get("calibration") or {}
        result_events = [
            event for event in log.get("events", [])
            if event.get("type") in {"calibration.passed", "calibration.failed_validation"}
        ]
        if result_events:
            for event in result_events:
                calibration_errors.append((event.get("data") or {}).get("errorDeg"))
                calibration_outcomes["passed" if event.get("type") == "calibration.passed" else "failed"] += 1
        else:
            calibration_errors.append(calibration.get("validationErrorDeg", quality.get("calibrationErrorDeg")))
        face_rates.append(quality.get("faceRate"))
        dropouts.append(quality.get("gazeDropout"))
        sample_counts.append(quality.get("sampleCount"))
        feature_coverage.append(quality.get("coverage", ood.get("coverage")))
        ood_max_z.append(quality.get("oodMaxRobustZ", ood.get("maxRobustZ")))
        fps_values.append(device.get("frameRate"))
        battery_levels.append(device.get("batteryLevel"))
        phase_counts.append(len((cue.get("occupancy") or {})))
        target_events = [event for event in log.get("events", []) if event.get("type") == "calibration.target_completed"]
        diagnostics = [(event.get("data") or {}) for event in target_events] or calibration.get("targetDiagnostics") or []
        for item in diagnostics:
            index = int(item.get("targetIndex", -1))
            for key in ("attempted", "accepted", "rejectedNoFace", "rejectedEye", "rejectedPose", "dispersionU", "dispersionV"):
                if isinstance(item.get(key), (int, float)):
                    target_stats[index][key].append(float(item[key]))
        for event in log.get("events", []):
            event_type = str(event.get("type", "unknown"))
            event_counts[event_type] += 1
            if event.get("level") in {"warning", "error"}:
                failures[event_type] += 1
            data = event.get("data") or {}
            if not diagnostics and event_type == "calibration.fit_failed":
                for item in data.get("targetDiagnostics", []):
                    index = int(item.get("targetIndex", -1))
                    for key in ("attempted", "accepted", "rejectedNoFace", "rejectedEye", "rejectedPose", "dispersionU", "dispersionV"):
                        if isinstance(item.get(key), (int, float)):
                            target_stats[index][key].append(float(item[key]))

    target_summary = {}
    for index, metrics in sorted(target_stats.items()):
        attempted = sum(metrics.get("attempted", []))
        accepted = sum(metrics.get("accepted", []))
        target_summary[str(index)] = {
            "acceptanceRate": accepted / attempted if attempted else None,
            **{key: _summary(values) for key, values in metrics.items()},
        }

    return {
        "schemaVersion": 1,
        "sessions": len(logs),
        "calibrationAttempts": sum(calibration_outcomes.values()),
        "calibrationAttemptOutcomes": dict(calibration_outcomes),
        "rejectedFiles": rejected or [],
        "modes": dict(Counter(log.get("mode", "unknown") for log in logs)),
        "purposes": dict(Counter(log.get("purpose", "legacy_unspecified") for log in logs)),
        "researchConsent": dict(Counter(str(bool((log.get("privacy") or {}).get("researchConsent"))).lower() for log in logs)),
        "eventCounts": dict(event_counts.most_common()),
        "failureEvents": dict(failures.most_common()),
        "metrics": {
            "calibrationErrorDeg": _summary(calibration_errors),
            "faceRate": _summary(face_rates),
            "gazeDropout": _summary(dropouts),
            "sampleCount": _summary(sample_counts),
            "featureCoverage": _summary(feature_coverage),
            "oodMaxRobustZ": _summary(ood_max_z),
            "deviceFps": _summary(fps_values),
            "batteryLevel": _summary(battery_levels),
            "aoiPhaseCount": _summary(phase_counts),
        },
        "calibrationTargets": target_summary,
        "privacyViolations": privacy_violations,
    }


def render_markdown(report: dict) -> str:
    lines = [
        "# Neurogaze Session Error Analysis",
        "",
        f"- Sessions valid: **{report['sessions']}**",
        f"- Calibration attempts: **{report['calibrationAttempts']}**",
        f"- Files rejected: **{len(report['rejectedFiles'])}**",
        f"- Privacy violations: **{len(report['privacyViolations'])}**",
        "",
        "## Failure events",
        "",
        "| Event | Count |",
        "|---|---:|",
    ]
    lines.extend(f"| `{name}` | {count} |" for name, count in report["failureEvents"].items())
    if not report["failureEvents"]:
        lines.append("| none | 0 |")
    lines.extend(["", "## Core metrics", "", "| Metric | N | Median | P90 |", "|---|---:|---:|---:|"])
    for name, value in report["metrics"].items():
        lines.append(f"| {name} | {value['n']} | {value['median']} | {value['p90']} |")
    lines.extend(["", "## Calibration target acceptance", "", "| Target | Acceptance | Rejected face | Rejected eye | Rejected pose |", "|---:|---:|---:|---:|---:|"])
    for target, value in report["calibrationTargets"].items():
        acceptance = value["acceptanceRate"]
        rate = "n/a" if acceptance is None else f"{100 * acceptance:.1f}%"
        lines.append(
            f"| {target} | {rate} | {value.get('rejectedNoFace', {}).get('median')} | "
            f"{value.get('rejectedEye', {}).get('median')} | {value.get('rejectedPose', {}).get('median')} |"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help="Audit JSON files or directories")
    parser.add_argument("--out", type=Path, default=Path("research/hasil/session_error_analysis.json"))
    args = parser.parse_args()
    logs, rejected = load_logs(args.paths)
    report = analyze_logs(logs, rejected)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    markdown_path = args.out.with_suffix(".md")
    markdown_path.write_text(render_markdown(report), encoding="utf-8", newline="\n")
    print(f"Analyzed {len(logs)} sessions -> {args.out} and {markdown_path}")


if __name__ == "__main__":
    main()
