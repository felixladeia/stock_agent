import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from app.main import create_app

def test_backtest_endpoint_with_monkeypatched_data(monkeypatch):
    app = create_app()
    client = TestClient(app)

    # Fixture OHLCV
    idx = pd.date_range("2021-01-01", periods=260, freq="B")  # business days
    close = pd.Series(np.linspace(50, 80, len(idx)), index=idx)
    df = pd.DataFrame(
        {
            "open": close * 0.999,
            "high": close * 1.01,
            "low": close * 0.99,
            "close": close,
            "volume": 1_000_000,
        },
        index=idx,
    )

    # Patch the tool used by the endpoint
    import app.api.routes.backtest as backtest_route
    monkeypatch.setattr(backtest_route, "get_ohlcv", lambda *args, **kwargs: df)

    payload = {
        "ticker": "AAPL",
        "lookback_years": 2,
        "interval": "1d",
        "strategy": {"type": "ma_crossover", "fast": 20, "slow": 50},
    }

    r = client.post("/backtest", json=payload)
    assert r.status_code == 200

    body = r.json()
    assert body["ticker"] == "AAPL"
    assert "metrics" in body
    assert "curve" in body
    assert len(body["curve"]["t"]) == len(body["curve"]["equity"])
    assert len(body["curve"]["t"]) == len(body["curve"]["position"])