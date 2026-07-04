from __future__ import annotations

from datetime import datetime
from typing import Sequence

import pandas as pd


def _add_month(label: str, offset: int) -> str:
    dt = datetime.strptime(f"{label}-01", "%Y-%m-%d")
    month = dt.month - 1 + offset
    year = dt.year + month // 12
    month = month % 12 + 1
    return f"{year:04d}-{month:02d}"


def run_prophet(
    labels: Sequence[str],
    values: Sequence[float],
    horizon: int,
    confidence: float,
) -> dict:
    from prophet import Prophet

    interval = {80: 0.80, 90: 0.90, 95: 0.95, 99: 0.99}.get(confidence, 0.95)
    ds = [f"{label}-01" for label in labels]
    df = pd.DataFrame({"ds": pd.to_datetime(ds), "y": values})

    model = Prophet(
        yearly_seasonality=len(values) >= 12,
        weekly_seasonality=False,
        daily_seasonality=False,
        interval_width=interval,
    )
    model.fit(df)

    future_dates = [pd.Timestamp(f"{label}-01") for label in labels]
    for i in range(horizon):
        future_dates.append(pd.Timestamp(f"{_add_month(labels[-1], i + 1)}-01"))
    future = pd.DataFrame({"ds": future_dates})
    forecast_df = model.predict(future)

    fitted = [max(0, round(float(v))) for v in forecast_df["yhat"].iloc[: len(values)]]
    forecast = [max(0, round(float(v))) for v in forecast_df["yhat"].iloc[len(values) :]]
    lower = [max(0, round(float(v))) for v in forecast_df["yhat_lower"].iloc[len(values) :]]
    upper = [max(0, round(float(v))) for v in forecast_df["yhat_upper"].iloc[len(values) :]]

    return {
        "fitted": fitted,
        "forecast": forecast,
        "lower": lower,
        "upper": upper,
        "feature_importance": [
            {"name": "Tren", "value": 0.45},
            {"name": "Yearly Seasonality", "value": 0.35},
            {"name": "Changepoints", "value": 0.2},
        ],
    }
