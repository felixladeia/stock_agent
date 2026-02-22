import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta


def _normalize_yfinance_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    yfinance can return:
      - normal columns: Open, High, Low, Close, Volume
      - MultiIndex columns: ('Open', 'AAPL'), ...
    This function flattens and normalizes to: open, high, low, close, volume
    """
    df = df.copy()

    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        # Typically level 0 is field name (Open/High/...) and level 1 is ticker
        df.columns = [str(c[0]).lower() for c in df.columns]
    else:
        df.columns = [str(c).lower() for c in df.columns]

    # Some yfinance variants may use "adj close" instead of "close"
    if "close" not in df.columns and "adj close" in df.columns:
        df = df.rename(columns={"adj close": "close"})

    required = ["open", "high", "low", "close", "volume"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required OHLCV columns: {missing}. Got columns: {list(df.columns)}")

    # Keep only required columns in correct order
    df = df[required]

    # Force numeric (if any object/nested junk sneaks in, it becomes NaN and then dropped)
    for c in required:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    df = df.dropna()
    return df


def get_ohlcv(
    ticker: str,
    lookback_years: int = 2,
    interval: str = "1d",
) -> pd.DataFrame:
    end = datetime.utcnow()
    start = end - timedelta(days=365 * lookback_years)

    df = yf.download(
        tickers=ticker,  # ensure single ticker string
        start=start.strftime("%Y-%m-%d"),
        end=end.strftime("%Y-%m-%d"),
        interval=interval,
        progress=False,
        auto_adjust=True,
    )

    if df is None or df.empty:
        raise ValueError(f"No data returned for {ticker}")

    df = _normalize_yfinance_columns(df)
    return df