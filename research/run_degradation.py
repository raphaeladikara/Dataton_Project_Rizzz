"""Run the documented one-factor and combined proxy degradation study."""

import json
from pathlib import Path

import numpy as np
import pandas as pd

from degradation import (
    CONDITIONS,
    bootstrap_auc_ci,
    degraded_feature_frame,
    feature_stability,
    fit_outer_predictors,
    load_sparse_scanpath,
    participant_metrics,
    predict_degraded,
)
from features import ALL_FEATURES, FEATURE_SETS, load_metadata
from training import save_json


ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "hasil"
SEEDS = (42, 314, 2718)
BOOTSTRAP_REPLICATIONS = 200


def main() -> None:
    meta = load_metadata()
    labels = meta.label.to_numpy(int)
    groups = meta.participant.to_numpy()
    original = pd.read_csv(RESULTS / "fitur.csv")[ALL_FEATURES]
    sparse = [load_sparse_scanpath(path) for path in meta.path]
    training = json.loads((RESULTS / "training.json").read_text(encoding="utf-8"))
    predictors = {
        name: fit_outer_predictors(original, labels, groups, features)
        for name, features in FEATURE_SETS.items()
    }
    rows = []

    for condition in CONDITIONS:
        by_set = {
            name: {"metrics": [], "participant_probabilities": []}
            for name in FEATURE_SETS
        }
        stability = []
        for seed in SEEDS:
            degraded = degraded_feature_frame(sparse, condition, seed)
            stability.append(feature_stability(original, degraded, ALL_FEATURES))
            for name, features in FEATURE_SETS.items():
                record_p = predict_degraded(degraded, features, predictors[name])
                threshold = training["candidates"][name]["metrics"]["operating_point"][
                    "threshold"
                ]
                metrics, participant_p, participant_y = participant_metrics(
                    record_p, labels, groups, threshold
                )
                by_set[name]["metrics"].append(metrics)
                by_set[name]["participant_probabilities"].append(participant_p)

        result_sets = {}
        for name, values in by_set.items():
            metric_rows = values["metrics"]
            result_sets[name] = {
                key: float(np.mean([row[key] for row in metric_rows]))
                for key in ("auc", "sensitivity", "specificity")
            }
            result_sets[name]["auc_ci95"] = bootstrap_auc_ci(
                values["participant_probabilities"],
                participant_y,
                BOOTSTRAP_REPLICATIONS,
            )
        rows.append(
            {
                "condition": condition.name,
                "axis": condition.axis,
                "parameters": {
                    "noise_deg": condition.noise_deg,
                    "sampling_hz": condition.sampling_hz,
                    "dropout": condition.dropout,
                    "pose_jitter_deg": condition.pose_jitter_deg,
                },
                "sets": result_sets,
                "feature_stability": {
                    "median_spearman": float(
                        np.mean([value["median_spearman"] for value in stability])
                    ),
                    "kinematic_median_spearman": float(
                        np.mean(
                            [
                                value["kinematic_median_spearman"]
                                for value in stability
                            ]
                        )
                    ),
                },
            }
        )
        print(condition.name, result_sets)

    tablet = next(row for row in rows if row["condition"] == "tablet_proxy")
    decision = {
        "selected_feature_set": "geometri",
        "n_features": 13,
        "status": "locked_for_mvp",
        "reasons": [
            "The production input is a 30 fps (x,y,t) stream; geometry is directly reproducible.",
            "The source PNGs discard temporal ordering, so 250-to-30 Hz kinematic derivatives cannot be validated directly.",
            "Sampling results are explicitly a raster sparsification proxy, not a physical resampling study.",
            f"At the combined tablet proxy, geometry AUC was {tablet['sets']['geometri']['auc']:.4f}.",
        ],
        "reconsider_when": "Raw paired 250 Hz eye-tracker and 30 fps tablet gaze streams are available.",
    }
    training["selection_status"] = "final_after_degradation"
    training["selected_feature_set"] = "geometri"
    training["selection_evidence"] = decision
    save_json(RESULTS / "training.json", training)
    save_json(RESULTS / "model.json", training["candidates"]["geometri"]["model"])
    save_json(
        RESULTS / "degradasi.json",
        {
            "study_type": "raster_proxy_degradation",
            "source_limitation": "Rendered PNGs contain no ordered gaze samples or timestamps.",
            "sampling_interpretation": "Pixel sparsification proxy only; not temporal resampling.",
            "pixels_per_degree_assumption": 20.0,
            "degradation_seeds": list(SEEDS),
            "bootstrap_replications_per_condition": BOOTSTRAP_REPLICATIONS,
            "quality_gate_abstention": None,
            "quality_gate_note": "Face/eye frame detection is absent from the source dataset and cannot be estimated.",
            "conditions": rows,
            "decision": decision,
        },
    )
    print(decision)


if __name__ == "__main__":
    main()
