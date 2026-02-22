import pandas as pd


def generate_signal(df: pd.DataFrame) -> dict:
    latest = df.iloc[-1]

    rsi = latest["rsi_14"]
    macd_hist = latest["macd_hist"]
    vol = latest["vol_20"]

    signal = "HOLD"
    confidence = 0.5

    # Oversold + bullish momentum
    if rsi < 35 and macd_hist > 0:
        signal = "BUY"
        confidence = 0.7

    # Overbought + bearish momentum
    elif rsi > 70 and macd_hist < 0:
        signal = "SELL"
        confidence = 0.7

    # Volatility adjustment
    if vol > 0.04:
        confidence *= 0.8

    return {
        "signal": signal,
        "confidence": float(round(confidence, 3)),
        "features": {
            "rsi_14": float(rsi),
            "macd_hist": float(macd_hist),
            "vol_20": float(vol),
        },
    }