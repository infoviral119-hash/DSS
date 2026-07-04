from __future__ import annotations

from datetime import datetime
from typing import Sequence

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor


def _month_features(label: str) -> tuple[float, float, int]:
    dt = datetime.strptime(f"{label}-01", "%Y-%m-%d")
    month = dt.month
    return np.sin(2 * np.pi * month / 12), np.cos(2 * np.pi * month / 12), month


def _build_rows(labels: Sequence[str], values: Sequence[float], lag: int = 3):
    xs, ys = [], []
    for i in range(lag, len(values)):
        row = [values[i - j - 1] for j in range(lag)]
        sin_m, cos_m, month = _month_features(labels[i])
        row.extend([i, sin_m, cos_m, month])
        xs.append(row)
        ys.append(values[i])
    return np.array(xs), np.array(ys)


def _feature_names(lag: int = 3) -> list[str]:
    names = [f"Lag-{i + 1}" for i in range(lag)]
    names.extend(["Tren", "Bulan Sin", "Bulan Cos", "Bulan"])
    return names


def _recursive_forecast(
    model,
    labels: Sequence[str],
    values: list[float],
    horizon: int,
    lag: int = 3,
) -> list[float]:
    history = list(values)
    hist_labels = list(labels)
    preds: list[float] = []

    for step in range(horizon):
        i = len(history)
        if len(history) < lag:
            preds.append(max(0, round(history[-1])))
            history.append(history[-1])
            continue

        next_label = _add_month(hist_labels[-1], 1)
        hist_labels.append(next_label)
        sin_m, cos_m, month = _month_features(next_label)
        row = [history[i - j - 1] for j in range(lag)] + [i, sin_m, cos_m, month]
        pred = max(0, float(model.predict(np.array([row]))[0]))
        preds.append(round(pred))
        history.append(pred)

    return preds


def _add_month(label: str, offset: int) -> str:
    dt = datetime.strptime(f"{label}-01", "%Y-%m-%d")
    month = dt.month - 1 + offset
    year = dt.year + month // 12
    month = month % 12 + 1
    return f"{year:04d}-{month:02d}"


def _fit_in_sample(model, labels: Sequence[str], values: Sequence[float], lag: int = 3) -> list[float]:
    fitted = [float(values[0])] * min(lag, len(values))
    if len(values) <= lag:
        return [float(v) for v in values]

    x, y = _build_rows(labels, values, lag)
    model.fit(x, y)
    preds = list(fitted)
    for i in range(lag, len(values)):
        sin_m, cos_m, month = _month_features(labels[i])
        row = [values[i - j - 1] for j in range(lag)] + [i, sin_m, cos_m, month]
        preds.append(max(0, round(float(model.predict(np.array([row]))[0]))))
    return preds


def run_random_forest(labels: Sequence[str], values: Sequence[float], horizon: int) -> dict:
    lag = min(3, max(1, len(values) - 2))
    model = RandomForestRegressor(n_estimators=120, random_state=42, min_samples_leaf=1)
    fitted = _fit_in_sample(model, labels, values, lag)
    forecast = _recursive_forecast(model, labels, list(values), horizon, lag)

    importance = []
    if hasattr(model, "feature_importances_") and len(values) > lag:
        x, _ = _build_rows(labels, values, lag)
        model.fit(x, np.array(values[lag:]))
        names = _feature_names(lag)
        for name, val in zip(names, model.feature_importances_):
            importance.append({"name": name, "value": round(float(val), 3)})

    return {"fitted": fitted, "forecast": forecast, "feature_importance": importance}


def run_xgboost(labels: Sequence[str], values: Sequence[float], horizon: int) -> dict:
    lag = min(3, max(1, len(values) - 2))
    model = XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        objective="reg:squarederror",
    )
    fitted = _fit_in_sample(model, labels, values, lag)
    forecast = _recursive_forecast(model, labels, list(values), horizon, lag)

    importance = []
    if hasattr(model, "feature_importances_") and len(values) > lag:
        x, _ = _build_rows(labels, values, lag)
        model.fit(x, np.array(values[lag:]))
        names = _feature_names(lag)
        for name, val in zip(names, model.feature_importances_):
            importance.append({"name": name, "value": round(float(val), 3)})

    return {"fitted": fitted, "forecast": forecast, "feature_importance": importance}
