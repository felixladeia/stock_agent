from fastapi import APIRouter
from pydantic import BaseModel, Field
import pandas as pd

from app.tools.market_data import get_ohlcv
from app.services.backtest_engine import run_ma_crossover_backtest

router = APIRouter()


class StrategySpec(BaseModel):
    type: str = Field(default="ma_crossover")
    fast: int = Field(default=20, ge=2, le=200)
    slow: int = Field(default=50, ge=3, le=400)


class BacktestRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=12)
    lookback_years: int = Field(default=2, ge=1, le=10)
    interval: str = Field(default="1d")
    strategy: StrategySpec = Field(default_factory=StrategySpec)


class CurveResponse(BaseModel):
    t: list[str]
    equity: list[float]
    benchmark: list[float]
    position: list[int]


class BacktestResponse(BaseModel):
    ticker: str
    interval: str
    metrics: dict
    curve: CurveResponse


@router.post("/backtest", response_model=BacktestResponse)
def backtest(req: BacktestRequest) -> BacktestResponse:
    tk = req.ticker.upper()

    df = get_ohlcv(tk, lookback_years=req.lookback_years, interval=req.interval)
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    if req.strategy.type != "ma_crossover":
        raise ValueError("Only strategy.type=ma_crossover is supported for now")

    res = run_ma_crossover_backtest(df, fast=req.strategy.fast, slow=req.strategy.slow)

    curve = res.curve
    t = [d.date().isoformat() for d in curve.index.to_pydatetime()]

    return BacktestResponse(
        ticker=tk,
        interval=req.interval,
        metrics=res.metrics,
        curve=CurveResponse(
            t=t,
            equity=[float(x) for x in curve["equity"].tolist()],
            benchmark=[float(x) for x in curve["benchmark"].tolist()],
            position=[int(x) for x in curve["position"].tolist()],
        ),
    )