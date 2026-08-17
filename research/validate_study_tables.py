"""Validate Gate A-D tables before any outcome analysis."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
SCHEMA = json.loads((ROOT / "research" / "configs" / "study_table_schemas.json").read_text(encoding="utf-8"))


def validate_table(frame: pd.DataFrame, gate: str) -> list[str]:
    if gate not in SCHEMA:
        raise KeyError(f"unknown gate: {gate}")
    errors = []
    required = SCHEMA[gate]["required"]
    missing = sorted(set(required) - set(frame.columns))
    if missing:
        errors.append(f"missing columns: {', '.join(missing)}")
        return errors
    id_columns = [name for name in ("participant_id", "child_id", "visit_id", "session_id") if name in frame]
    if id_columns and frame[id_columns].isna().any().any():
        errors.append("null identifiers")
    if gate == "gateC":
        partitions = frame.groupby("child_id").partition.nunique()
        if (partitions > 1).any(): errors.append("child leakage across partitions")
        external_sites = set(frame.loc[frame.partition == "external", "site_id"])
        development_sites = set(frame.loc[frame.partition != "external", "site_id"])
        if external_sites & development_sites: errors.append("external site appears in development")
    if gate == "gateD":
        labels = frame.groupby(["child_id", "visit_id", "session_id"]).label.nunique()
        if (labels > 1).any(): errors.append("inconsistent label within paired session")
        duplicates = frame.duplicated(["child_id", "visit_id", "session_id", "fold", "modality"])
        if duplicates.any(): errors.append("duplicate modality prediction within paired session")
    return errors


def validate_csv(path: Path, gate: str) -> None:
    errors = validate_table(pd.read_csv(path), gate)
    if errors: raise ValueError("; ".join(errors))
