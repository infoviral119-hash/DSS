from __future__ import annotations

import math
from typing import Sequence


def compute_metrics(actual: Sequence[float], predicted: Sequence[float]) -> dict:
    n = min(len(actual), len(predicted))
    if n == 0:
        return {"mape": 0, "mae": 0, "rmse": 0, "r2": 0, "accuracy": 0, "bias": 0}

    se = ae = ape_sum = ape_n = bias = 0.0
    y_mean = sum(actual[:n]) / n
    ss_res = ss_tot = 0.0

    for i in range(n):
        e = actual[i] - predicted[i]
        se += e * e
        ae += abs(e)
        bias += e
        if actual[i] != 0:
            ape_sum += abs(e / actual[i])
            ape_n += 1
        ss_res += e * e
        ss_tot += (actual[i] - y_mean) ** 2

    mae = ae / n
    rmse = math.sqrt(se / n)
    mape = (ape_sum / ape_n * 100) if ape_n else 0
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    accuracy = max(0, min(100, 100 - mape))

    return {
        "mape": round(mape, 1),
        "mae": round(mae, 1),
        "rmse": round(rmse, 1),
        "r2": round(r2, 3),
        "accuracy": round(accuracy, 1),
        "bias": round(bias / n, 1),
    }


def status_from_mape(mape: float) -> str:
    if mape <= 5:
        return "excellent"
    if mape <= 12:
        return "good"
    return "fair"
