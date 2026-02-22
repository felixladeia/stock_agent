from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
import pandas as pd

from app.tools.market_data import get_ohlcv

router = APIRouter()

class OhlcvResponse(BaseModel):
    ticker: str
    interval: str = "1d"
    t: list[str] = Field(..., description="timestamps (ISO date strings)")
    o: list[float]
    h: list[float]
    l: list[float]
    c: list[float]
    v: list[float]

@router.get("/ohlcv", response_model=OhlcvResponse)
def ohlcv(
    ticker: str = Query(..., min_length=1, max_length=12),
    lookback_years: int = Query(2, ge=1, le=10),
    interval: str = Query("1d"),
):
    tk = ticker.upper()
    df = get_ohlcv(tk, lookback_years=lookback_years, interval=interval)

    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    t = [d.date().isoformat() for d in df.index.to_pydatetime()]

    return OhlcvResponse(
        ticker=tk,
        interval=interval,
        t=t,
        o=df["open"].astype(float).tolist(),
        h=df["high"].astype(float).tolist(),
        l=df["low"].astype(float).tolist(),
        c=df["close"].astype(float).tolist(),
        v=df["volume"].astype(float).fillna(0.0).tolist(),
    )