---
title: e-Insight ML Forecast
emoji: 📊
colorFrom: blue
colorTo: green
sdk: docker
app_port: 8000
pinned: false
license: mit
---

# e-Insight ML Service

FastAPI forecast service for [e-Insight DSS](https://e-insight.pages.dev).

**Endpoints**
- `GET /health` — service and model availability
- `POST /forecast` — Prophet, XGBoost, Random Forest, LSTM, Hybrid

## Deploy this Space (from monorepo)

1. Create a **Docker** Space at [huggingface.co/new-space](https://huggingface.co/new-space?sdk=docker)
2. Clone the empty Space repo, copy all files from `ml-service/` into it, push
3. Build takes about 5–15 minutes
4. API URL: `https://<username>-e-insight-ml.hf.space`

Or from repo root:

```powershell
pip install "huggingface_hub[cli]"
$env:HF_TOKEN = "hf_..."
.\scripts\deploy-ml-huggingface.ps1 -SpaceName "e-insight-ml"
.\scripts\sync-ml-url.ps1 -Url "https://<username>-e-insight-ml.hf.space"
```
