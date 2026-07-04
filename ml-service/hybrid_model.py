from __future__ import annotations

from typing import Sequence

import numpy as np

from lstm_model import run_lstm
from metrics import compute_metrics
from sklearn_models import run_random_forest, run_xgboost


def run_hybrid(labels: Sequence[str], values: Sequence[float], horizon: int, confidence: float) -> dict:
    runners = []
    candidates = [
        ("random_forest", lambda: run_random_forest(labels, values, horizon)),
        ("xgboost", lambda: run_xgboost(labels, values, horizon)),
        ("lstm", lambda: run_lstm(labels, values, horizon)),
    ]

    weights: list[float] = []
    fits: list[dict] = []

    holdout = min(4, max(2, len(values) // 5))
    if len(values) > holdout + 3:
        train_v = values[:-holdout]
        for name, fn in candidates:
            try:
                partial = fn()
                preds = partial["forecast"][:holdout]
                m = compute_metrics(list(values[-holdout:]), preds)
                w = 1 / max(m["mape"], 0.5)
                weights.append(w)
                fits.append(partial)
                runners.append(name)
            except Exception:
                continue
    else:
        for _, fn in candidates:
            try:
                fits.append(fn())
                weights.append(1.0)
            except Exception:
                continue

    if not fits:
        return run_lstm(labels, values, horizon)

    w_arr = np.array(weights[: len(fits)])
    w_arr = w_arr / w_arr.sum()

    fitted = np.zeros(len(values))
    forecast = np.zeros(horizon)
    for w, fit in zip(w_arr, fits):
        f = np.array(fit["fitted"][: len(values)] + [0] * max(0, len(values) - len(fit["fitted"])))[: len(values)]
        fitted += w * f
        fc = np.array(fit["forecast"][:horizon] + [0] * max(0, horizon - len(fit["forecast"])))[:horizon]
        forecast += w * fc

    std = float(np.std(values)) if len(values) > 1 else 1.0
    lower = [max(0, round(v - std * 0.8)) for v in forecast]
    upper = [round(v + std * 0.8) for v in forecast]

    return {
        "fitted": [max(0, round(v)) for v in fitted],
        "forecast": [max(0, round(v)) for v in forecast],
        "lower": lower,
        "upper": upper,
        "feature_importance": [
            {"name": "Random Forest", "value": round(float(w_arr[0]) if len(w_arr) > 0 else 0.33, 3)},
            {"name": "XGBoost", "value": round(float(w_arr[1]) if len(w_arr) > 1 else 0.33, 3)},
            {"name": "LSTM Neural", "value": round(float(w_arr[2]) if len(w_arr) > 2 else 0.34, 3)},
        ],
    }
