from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
import pandas as pd

from app.tools.market_data import get_ohlcv
from app.tools.indicators import compute_indicators

router = APIRouter()


class IndicatorsResponse(BaseModel):
    ticker: str
    interval: str = "1d"

    # aligned arrays (NaN warm-up removed)
    t: list[str] = Field(..., description="timestamps (ISO date strings)")
    rsi_14: list[float]
    macd: list[float]
    macd_signal: list[float]
    macd_hist: list[float]
    vol_20: list[float]


@router.get("/indicators", response_model=IndicatorsResponse)
def indicators(
    ticker: str = Query(..., min_length=1, max_length=12),
    lookback_years: int = Query(2, ge=1, le=10),
    interval: str = Query("1d"),
):
    tk = ticker.upper()

    # 1) OHLCV
    df = get_ohlcv(tk, lookback_years=lookback_years, interval=interval)
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    # 2) Indicators
    df = compute_indicators(df)

    # 3) Keep only indicator columns + drop NaNs from warmup
    cols = ["rsi_14", "macd", "macd_signal", "macd_hist", "vol_20"]
    out = df[cols].dropna().copy()

    # Align timestamps to out
    t = [d.date().isoformat() for d in out.index.to_pydatetime()]

    return IndicatorsResponse(
        ticker=tk,
        interval=interval,
        t=t,
        rsi_14=out["rsi_14"].astype(float).tolist(),
        macd=out["macd"].astype(float).tolist(),
        macd_signal=out["macd_signal"].astype(float).tolist(),
        macd_hist=out["macd_hist"].astype(float).tolist(),
        vol_20=out["vol_20"].astype(float).tolist(),
    )