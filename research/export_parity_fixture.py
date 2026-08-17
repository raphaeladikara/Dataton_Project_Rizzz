"""Generate deterministic Python golden vectors for the TypeScript parity test."""

import json
import math
from pathlib import Path

import numpy as np

from features import GEOMETRY_FEATURES, features_from_rgb
from training import predict_from_export


ROOT = Path(__file__).resolve().parent.parent
WIDTH, HEIGHT = 640, 480


def js_round(value: float) -> int:
    return math.floor(value + 0.5)


def rasterize(points: list[dict]) -> np.ndarray:
    mask = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)

    def mark(x: int, y: int) -> None:
        for oy in (-1, 0, 1):
            for ox in (-1, 0, 1):
                px = min(WIDTH - 1, max(0, x + ox))
                py = min(HEIGHT - 1, max(0, y + oy))
                mask[py, px] = 1

    for index, current in enumerate(points):
        x1 = js_round(current["x"] * (WIDTH - 1))
        y1 = js_round(current["y"] * (HEIGHT - 1))
        if index == 0:
            mark(x1, y1)
            continue
        previous = points[index - 1]
        x0 = js_round(previous["x"] * (WIDTH - 1))
        y0 = js_round(previous["y"] * (HEIGHT - 1))
        steps = max(abs(x1 - x0), abs(y1 - y0), 1)
        for step in range(steps + 1):
            mark(
                js_round(x0 + (x1 - x0) * step / steps),
                js_round(y0 + (y1 - y0) * step / steps),
            )
    return np.repeat(mask[:, :, None], 3, axis=2).astype(float)


def main() -> None:
    points = [
        {
            "t": index * 33.333,
            "x": 0.5 + 0.34 * math.sin(index * 0.37),
            "y": 0.48 + 0.27 * math.cos(index * 0.23),
        }
        for index in range(90)
    ]
    feature_dict = features_from_rgb(rasterize(points))
    features = {name: feature_dict[name] for name in GEOMETRY_FEATURES}
    model = json.loads(
        (ROOT / "research" / "hasil" / "model.json").read_text(encoding="utf-8")
    )
    values = np.asarray([[features[name] for name in model["feature_order"]]])
    fixture = {
        "points": points,
        "features": features,
        "probability": float(predict_from_export(model, values)[0]),
        "model_version": model["model_version"],
    }
    target = ROOT / "app" / "tests" / "fixtures" / "parity.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")
    print(target)


if __name__ == "__main__":
    main()
