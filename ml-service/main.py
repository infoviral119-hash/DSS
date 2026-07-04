from __future__ import annotations

import os
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from metrics import compute_metrics, status_from_mape
from prophet_model import run_prophet
from sklearn_models import run_random_forest, run_xgboost
from lstm_model import run_lstm
from hybrid_model import run_hybrid

app = FastAPI(title="e-Insight ML Forecast Service", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ML_MODELS = {
    "prophet": {"name": "Prophet", "runner": "prophet"},
    "random_forest": {"name": "Random Forest Regression", "runner": "sklearn"},
    "xgboost": {"name": "XGBoost Regression", "runner": "sklearn"},
    "lstm": {"name": "LSTM", "runner": "lstm"},
    "hybrid": {"name": "Hybrid Forecast", "runner": "hybrid"},
}

PROPHET_OK = True
try:
    import prophet  # noqa: F401
except Exception:
    PROPHET_OK = False


class ForecastRequest(BaseModel):
    labels: list[str] = Field(min_length=3)
    values: list[float] = Field(min_length=3)
    horizon: int = Field(default=6, ge=1, le=24)
    confidence: float = Field(default=95)
    model: Literal["auto", "prophet", "random_forest", "xgboost", "lstm", "hybrid"] = "auto"
    holdout: int = Field(default=6, ge=2, le=12)


def _run_single(model_id: str, labels: list[str], values: list[float], horizon: int, confidence: float) -> dict:
    if model_id == "prophet":
        if not PROPHET_OK:
            raise RuntimeError("Prophet tidak tersedia")
        return run_prophet(labels, values, horizon, confidence)
    if model_id == "random_forest":
        return run_random_forest(labels, values, horizon)
    if model_id == "xgboost":
        return run_xgboost(labels, values, horizon)
    if model_id == "lstm":
        return run_lstm(labels, values, horizon)
    if model_id == "hybrid":
        return run_hybrid(labels, values, horizon, confidence)
    raise ValueError(f"Unknown model: {model_id}")


def _evaluate_model(model_id: str, labels: list[str], values: list[float], holdout: int, confidence: float) -> dict | None:
    if model_id == "prophet" and not PROPHET_OK:
        return None
    if len(values) <= holdout + 2:
        return None

    train_labels = labels[:-holdout]
    train_values = values[:-holdout]
    test_values = values[-holdout:]

    try:
        result = _run_single(model_id, train_labels, train_values, holdout, confidence)
        preds = result["forecast"][:holdout]
        metrics = compute_metrics(test_values, preds)
        return {
            "id": model_id,
            "name": ML_MODELS[model_id]["name"],
            "metrics": metrics,
            "status": status_from_mape(metrics["mape"]),
            "available": True,
            "fit": result,
        }
    except Exception:
        return None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ml-forecast",
        "models": {
            "prophet": PROPHET_OK,
            "random_forest": True,
            "xgboost": True,
            "lstm": True,
            "hybrid": True,
        },
    }


@app.post("/forecast")
def forecast(req: ForecastRequest):
    labels = req.labels
    values = [float(v) for v in req.values]
    holdout = min(req.holdout, max(2, len(values) // 4))

    comparison = []

    for model_id in ML_MODELS:
        evaluated = _evaluate_model(model_id, labels, values, holdout, req.confidence)
        if evaluated:
            comparison.append({k: v for k, v in evaluated.items() if k != "fit"})

    comparison.sort(key=lambda x: x["metrics"]["mape"])

    available_ids = [c["id"] for c in comparison]
    if not available_ids:
        return {"available": False, "message": "Tidak ada model ML yang dapat dijalankan"}

    selected = req.model
    if selected == "auto" or selected not in available_ids:
        selected = comparison[0]["id"]

    try:
        full_fit = _run_single(selected, labels, values, req.horizon, req.confidence)
    except Exception as exc:
        return {"available": False, "message": str(exc)}

    train_preds = full_fit["fitted"]
    metrics = compute_metrics(values, train_preds)

    comparison_marks = []
    for i, row in enumerate(comparison):
        status = "best" if i == 0 else row["status"]
        comparison_marks.append({**row, "status": status})

    return {
        "available": True,
        "model": selected,
        "modelName": ML_MODELS[selected]["name"],
        "fitted": full_fit["fitted"],
        "forecast": full_fit["forecast"],
        "lower": full_fit.get("lower"),
        "upper": full_fit.get("upper"),
        "metrics": metrics,
        "featureImportance": full_fit.get("feature_importance", []),
        "comparison": comparison_marks,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ML_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
