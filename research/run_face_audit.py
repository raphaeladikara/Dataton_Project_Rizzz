"""Audit the static face dataset without training a face/ASD model."""

from __future__ import annotations

import hashlib
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageFile
from scipy.fft import dctn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from training import save_json


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "AutismDataset" / "consolidated"
RESULTS = ROOT / "research" / "hasil"
RANDOM_STATE = 42


def perceptual_hash(gray: Image.Image) -> int:
    values = np.asarray(gray.resize((32, 32)), dtype=float)
    frequency = dctn(values, type=2, norm="ortho")[:8, :8].ravel()
    bits = frequency[1:] > np.median(frequency[1:])
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return value


def inspect_image(path: Path, label: str) -> dict:
    raw = path.read_bytes()
    with Image.open(path) as image:
        image.load()
        rgb = image.convert("RGB")
        array = np.asarray(rgb.resize((64, 64)), dtype=float) / 255.0
        gray = np.asarray(rgb.convert("L").resize((64, 64)), dtype=float) / 255.0
        border = np.concatenate(
            [gray[0], gray[-1], gray[1:-1, 0], gray[1:-1, -1]]
        )
        dx = np.diff(gray, axis=1)
        dy = np.diff(gray, axis=0)
        return {
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "file": path.name,
            "label": label,
            "width": image.width,
            "height": image.height,
            "aspect_ratio": image.width / image.height,
            "mode": image.mode,
            "format": image.format,
            "bytes": len(raw),
            "mean_r": float(array[:, :, 0].mean()),
            "mean_g": float(array[:, :, 1].mean()),
            "mean_b": float(array[:, :, 2].mean()),
            "brightness_std": float(gray.std()),
            "border_brightness": float(border.mean()),
            "edge_energy": float(np.mean(dx * dx) + np.mean(dy * dy)),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "phash": perceptual_hash(rgb.convert("L")),
        }


def near_duplicate_pairs(hashes: list[int], max_distance: int = 4) -> list[tuple]:
    # 2,940^2 / 2 comparisons are tractable and keep the implementation auditable.
    pairs = []
    for i in range(len(hashes)):
        for j in range(i + 1, len(hashes)):
            distance = (hashes[i] ^ hashes[j]).bit_count()
            if distance <= max_distance:
                pairs.append((i, j, distance))
    return pairs


def technical_shortcut_test(frame: pd.DataFrame) -> dict:
    columns = [
        "width",
        "height",
        "aspect_ratio",
        "bytes",
        "mean_r",
        "mean_g",
        "mean_b",
        "brightness_std",
        "border_brightness",
        "edge_energy",
    ]
    X = frame[columns].to_numpy(float)
    y = (frame.label == "Autistic").to_numpy(int)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    pipeline = make_pipeline(
        StandardScaler(), LogisticRegression(max_iter=5000, random_state=RANDOM_STATE)
    )
    probability = cross_val_predict(
        pipeline, X, y, cv=cv, method="predict_proba"
    )[:, 1]
    observed = float(roc_auc_score(y, probability))
    rng = np.random.default_rng(RANDOM_STATE)
    permutation_scores = []
    for _ in range(200):
        shuffled = rng.permutation(y)
        p = cross_val_predict(
            pipeline, X, shuffled, cv=cv, method="predict_proba"
        )[:, 1]
        permutation_scores.append(roc_auc_score(shuffled, p))
    return {
        "features": columns,
        "model": "logistic_regression_on_technical_image_properties_only",
        "cv": "5-fold stratified; identity grouping impossible because IDs are absent",
        "auc": observed,
        "permutations": 200,
        "permutation_p_value": float(
            (1 + np.sum(np.asarray(permutation_scores) >= observed))
            / (len(permutation_scores) + 1)
        ),
        "interpretation": "Detects collection/processing shortcuts, not ASD signal.",
    }


def main() -> None:
    ImageFile.LOAD_TRUNCATED_IMAGES = False
    records = []
    corrupted = []
    for label in ("Autistic", "Non_Autistic"):
        for path in sorted((DATA / label).glob("*")):
            if not path.is_file():
                continue
            try:
                records.append(inspect_image(path, label))
            except Exception as exc:  # retain exact audit evidence
                corrupted.append({"path": str(path), "error": repr(exc)})

    frame = pd.DataFrame(records)
    sha_groups = defaultdict(list)
    for index, value in enumerate(frame.sha256):
        sha_groups[value].append(index)
    exact_clusters = [values for values in sha_groups.values() if len(values) > 1]
    near_pairs = near_duplicate_pairs(frame.phash.astype(object).tolist())

    def cross_label(pair) -> bool:
        return frame.iloc[pair[0]].label != frame.iloc[pair[1]].label

    size_counts = (
        frame.groupby(["label", "width", "height"])
        .size()
        .sort_values(ascending=False)
        .head(20)
    )
    audit = {
        "dataset": "data/AutismDataset/consolidated",
        "inventory": {
            "total_files": int(len(frame) + len(corrupted)),
            "readable_images": int(len(frame)),
            "corrupted": corrupted,
            "labels": frame.label.value_counts().to_dict(),
            "formats": frame["format"].value_counts().to_dict(),
            "modes": frame["mode"].value_counts().to_dict(),
            "top_resolutions": [
                {
                    "label": label,
                    "width": int(width),
                    "height": int(height),
                    "count": int(count),
                }
                for (label, width, height), count in size_counts.items()
            ],
        },
        "provenance": {
            "source_url_in_repo": None,
            "license_in_repo": None,
            "consent_documentation": None,
            "demographics": None,
            "label_definition": None,
            "participant_ids": None,
            "status": "unverified",
        },
        "duplicates": {
            "exact_clusters": len(exact_clusters),
            "exact_files_in_clusters": int(sum(map(len, exact_clusters))),
            "exact_cross_label_clusters": int(
                sum(
                    len(set(frame.iloc[index].label for index in cluster)) > 1
                    for cluster in exact_clusters
                )
            ),
            "near_duplicate_hamming_lte_4_pairs": len(near_pairs),
            "near_duplicate_cross_label_pairs": int(sum(map(cross_label, near_pairs))),
        },
        "identity_audit": {
            "status": "not_possible_reliably",
            "reason": "No participant IDs; perceptual similarity is not identity.",
            "consequence": "Any train/test split could leak the same child across folds.",
        },
        "technical_shortcut_baseline": technical_shortcut_test(frame),
        "ethics": {
            "assessment": "Static facial morphology must not be used to infer ASD in this MVP.",
            "risks": [
                "Unverified consent and licensing for identifiable children.",
                "Physiognomic inference can encode demographic and collection bias.",
                "A static face is not the dynamic head/face behavior proposed by Neurogaze.",
                "No participant grouping or demographic audit is possible.",
            ],
        },
        "decision": {
            "status": "reject_for_asd_modeling_and_quarantine",
            "included_in_neurogaze_score": False,
            "cnn_trained": False,
            "allowed_use": "None until provenance, license, and consent are documented; detector robustness may be reconsidered afterward.",
            "reconsider_when": [
                "Provenance, license, consent, demographics, and label definition are documented.",
                "Stable participant IDs support identity-grouped evaluation.",
                "A clinical/ethical review justifies a behaviorally relevant research question.",
            ],
        },
    }
    frame.drop(columns=["phash"]).to_csv(
        RESULTS / "audit_wajah_inventory.csv", index=False
    )
    save_json(RESULTS / "audit_wajah.json", audit)
    print(audit["inventory"])
    print(audit["duplicates"])
    print(audit["technical_shortcut_baseline"])
    print(audit["decision"])


if __name__ == "__main__":
    main()
