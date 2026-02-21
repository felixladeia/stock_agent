from fastapi import APIRouter
from app.agent.schemas import AnalyzeRequest, AnalyzeResponse, EvidenceItem, RiskBlock, Provenance

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    # Step 1: hardcoded stub (but schema-valid)
    # Later: replace with tool pipeline (market_data -> indicators -> news/RAG -> risk -> format)
    ticker = req.ticker.upper()

    evidence = [
        EvidenceItem(
            type="note",
            title="Stub analysis",
            source="system",
            snippet="This is a placeholder response. Next step: replace with real OHLCV + indicators + RAG."
        )
    ]

    risk = RiskBlock(
        stop_loss_pct=min(0.05, req.constraints.max_daily_loss_pct * 2.5),
        take_profit_pct=0.10,
        invalidators=[
            "Major unexpected news contradicts thesis",
            "Volatility spike beyond historical band"
        ],
    )

    prov = Provenance(
        tool_calls=[],
        retrieved_doc_ids=[],
        data_windows={"prices": None, "news_lookback_days": None},
    )

    return AnalyzeResponse(
        ticker=ticker,
        signal="HOLD",
        confidence=0.55,
        horizon_days=req.horizon_days,
        thesis_bullets=[
            f"{ticker}: Stub thesis bullet #1 (replace with numeric + news evidence).",
            "Stub thesis bullet #2: risk-aware, but not data-driven yet.",
        ],
        numeric_features={"stub_feature": 0.0},
        evidence=evidence,
        risk=risk,
        provenance=prov,
    )
