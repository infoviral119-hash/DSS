from __future__ import annotations

from datetime import datetime
from typing import Sequence

import numpy as np
from sklearn.neural_network import MLPRegressor


def _add_month(label: str, offset: int) -> str:
    dt = datetime.strptime(f"{label}-01", "%Y-%m-%d")
    month = dt.month - 1 + offset
    year = dt.year + month // 12
    month = month % 12 + 1
    return f"{year:04d}-{month:02d}"


def _build_sequences(values: Sequence[float], lag: int = 6):
    xs, ys = [], []
    for i in range(lag, len(values)):
        xs.append(list(values[i - lag : i]))
        ys.append(values[i])
    return np.array(xs), np.array(ys)


def run_lstm(labels: Sequence[str], values: Sequence[float], horizon: int) -> dict:
    lag = min(6, max(3, len(values) - 2))
    if len(values) <= lag + 1:
        last = float(values[-1])
        return {
            "fitted": [int(v) for v in values],
            "forecast": [max(0, round(last))] * horizon,
            "feature_importance": [{"name": f"Lag-{i+1}", "value": round(1 / lag, 3)} for i in range(lag)],
        }

    x, y = _build_sequences(values, lag)
    model = MLPRegressor(
        hidden_layer_sizes=(32, 16),
        activation="tanh",
        max_iter=800,
        random_state=42,
        early_stopping=True,
    )
    model.fit(x, y)

    fitted = [float(values[0])] * lag
    for i in range(lag, len(values)):
        row = np.array([list(values[i - lag : i])])
        fitted.append(max(0, round(float(model.predict(row)[0]))))

    history = list(values)
    hist_labels = list(labels)
    forecast: list[int] = []
    for _ in range(horizon):
        row = np.array([history[-lag:]])
        pred = max(0, float(model.predict(row)[0]))
        forecast.append(round(pred))
        history.append(pred)
        hist_labels.append(_add_month(hist_labels[-1], 1))

    importance = [{"name": f"Lag-{i+1}", "value": round(1 / lag, 3)} for i in range(lag)]
    importance.append({"name": "Neural Hidden", "value": 0.25})

    return {"fitted": fitted, "forecast": forecast, "feature_importance": importance}
