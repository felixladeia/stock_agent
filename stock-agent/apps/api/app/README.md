# Stock Agent API (FastAPI)

Backend service for the Stock Agent project.

## What this API provides (current)

- `GET /health` — health check
- `POST /analyze` — OHLCV + indicators + deterministic signal output (schema validated)
- `GET /ohlcv?ticker=...` — OHLCV arrays for frontend charting
- `GET /indicators?ticker=...` — RSI/MACD/volatility arrays for frontend charting
- `POST /backtest` — MA crossover backtest (equity curve + metrics)

## Requirements

- Python 3.11+

---

## Setup (recommended: uv)

From repo root:

```bash
cd apps/api
pip install uv
uv venv
source .venv/bin/activate
uv sync --extra dev