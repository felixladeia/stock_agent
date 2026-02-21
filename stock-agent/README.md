📈 Stock Agent — AI Research & Trading Analysis Platform
A modular AI-powered stock research agent with:

⚛️ React (Next.js) frontend
🚀 FastAPI backend
🧠 Structured agent output schema
🔍 RAG-ready architecture
🧪 Test + eval pipeline (planned)

📊 Backtesting + paper trading (planned)

🖼️ Candlestick vision analysis (planned)

This project is designed as a production-minded research system, not just a demo.

🏗 Architecture Overview
Next.js (web UI)
        ↓
FastAPI (agent runtime)
        ↓
Tools (market data, indicators, news, backtest)
        ↓
RAG (vector store + embeddings)
        ↓
Risk Engine
        ↓
Structured JSON Output

Current phase:

✅ Strict API schema

✅ Frontend integration

✅ CORS fixed

🔜 Market data integration

🔜 Indicator computation

🔜 News + RAG

🔜 Backtesting

🔜 Vision-based signal

📁 Repository Structure
stock-agent/
  apps/
    web/      → Next.js frontend
    api/      → FastAPI backend
  packages/
    shared/   → Shared schemas (future)
  evals/      → RAG + agent + backtest evaluations (future)
  infra/      → Docker + deployment configs (future)
🚀 Getting Started (Local Development)
1️⃣ Backend (FastAPI)

Navigate to:

cd apps/api

Install dependencies:

pip install fastapi uvicorn pydantic

Run the API:

uvicorn app.main:app --reload --port 8000

Test:

curl http://localhost:8000/health

Open API docs:

http://localhost:8000/docs
2️⃣ Frontend (Next.js)

Navigate to:

cd apps/web

Install dependencies:

npm install

Run:

npm run dev

Open:

http://localhost:3000
📦 Current API Contract
POST /analyze

Example request:

{
  "ticker": "AAPL",
  "horizon_days": 20,
  "constraints": {
    "max_position_pct": 0.1,
    "max_daily_loss_pct": 0.02
  }
}

Example response (stub phase):

{
  "ticker": "AAPL",
  "signal": "HOLD",
  "confidence": 0.55,
  "horizon_days": 20,
  "thesis_bullets": [...],
  "numeric_features": {...},
  "evidence": [...],
  "risk": {...},
  "provenance": {...}
}

All responses are validated via:

🐍 Pydantic (backend)

🔷 Zod (frontend)

This guarantees schema integrity.

🧠 Design Philosophy
1️⃣ Strict Schema First

The agent always returns structured, machine-readable output.

No unstructured text blobs.

2️⃣ Tools > Hallucination

The model must call:

Market data tool

Indicator tool

RAG retriever

Backtest tool

Never invent numbers.

3️⃣ Risk-Aware by Design

Every signal must include:

Stop loss

Take profit

Invalidators

Position constraints

4️⃣ Evidence Required

Every thesis bullet must be backed by:

Numeric features

Retrieved documents

Tool outputs

🧪 Testing Strategy (Planned)

We will implement three testing layers:

1️⃣ Unit Tests

Indicator correctness

Risk engine logic

Tool reliability

2️⃣ Integration Tests

/analyze endpoint contract

RAG retrieval quality

3️⃣ Evaluation Metrics

Sharpe ratio

Max drawdown

Hit rate

Signal stability

RAG faithfulness

🔮 Roadmap
Phase 1 — Numeric Core

 Market data integration (yfinance or Alpaca)

 Indicator engine (RSI, MACD, volatility)

 Replace stub with data-driven signal

Phase 2 — News + RAG

 News ingestion

 Vector store (pgvector)

 Retrieval + citation system

Phase 3 — Backtesting

 Strategy spec interface

 Vectorized backtest engine

 Performance metrics dashboard

Phase 4 — Paper Trading

 Alpaca integration

 Execution gate with human approval

Phase 5 — Vision Signal

 Candlestick image generation

 CNN classifier

 Vision as secondary signal

⚠️ Disclaimer

This project is for research and educational purposes only.
It does not provide financial advice.
All trading decisions carry risk.

🧑‍💻 Development Notes

Frontend runs on localhost:3000

Backend runs on localhost:8000

CORS enabled for local development

Schema consistency enforced across stack

🏁 Next Step

The next milestone:

Replace stub /analyze with real OHLCV + indicator computation.

Once merged, we move to:

deterministic fixtures

unit tests

backtest sanity checks