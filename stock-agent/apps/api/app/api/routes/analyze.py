from fastapi import APIRouter
from app.agent.schemas import AnalyzeRequest, AnalyzeResponse, EvidenceItem, RiskBlock, Provenance
from app.tools.market_data import get_ohlcv
from app.tools.indicators import compute_indicators
from app.services.signal_engine import generate_signal

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    ticker = req.ticker.upper()

    # 1️⃣ Fetch data
    df = get_ohlcv(ticker)

    # 2️⃣ Compute indicators
    df = compute_indicators(df)

    # 3️⃣ Generate signal
    result = generate_signal(df)

    signal = result["signal"]
    confidence = result["confidence"]
    features = result["features"]

    # 4️⃣ Build thesis
    thesis = [
        f"RSI(14): {features['rsi_14']:.2f}",
        f"MACD histogram: {features['macd_hist']:.4f}",
        f"20-day volatility: {features['vol_20']:.4f}",
    ]

    # 5️⃣ Risk logic
    risk = RiskBlock(
        stop_loss_pct=min(0.05, req.constraints.max_daily_loss_pct * 2.5),
        take_profit_pct=0.10,
        invalidators=[
            "Momentum reversal in MACD histogram",
            "RSI crosses neutral band",
        ],
    )

    prov = Provenance(
        tool_calls=[
            {"tool": "get_ohlcv", "ticker": ticker},
            {"tool": "compute_indicators"},
            {"tool": "generate_signal"},
        ],
        retrieved_doc_ids=[],
        data_windows={
            "lookback_years": 2,
            "interval": "1d",
        },
    )

    return AnalyzeResponse(
        ticker=ticker,
        signal=signal,
        confidence=confidence,
        horizon_days=req.horizon_days,
        thesis_bullets=thesis,
        numeric_features=features,
        evidence=[
            EvidenceItem(
                type="numeric",
                title="Technical indicators",
                source="indicator_engine",
                snippet="Signal derived from RSI, MACD, and rolling volatility.",
            )
        ],
        risk=risk,
        provenance=prov,
    )