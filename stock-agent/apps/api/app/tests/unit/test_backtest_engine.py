import pandas as pd
import numpy as np
from app.services.backtest_engine import run_ma_crossover_backtest

def test_ma_crossover_backtest_runs_and_returns_metrics():
    # Deterministic synthetic upward trend
    idx = pd.date_range("2020-01-01", periods=300, freq="D")
    close = pd.Series(np.linspace(100, 200, 300), index=idx)

    df = pd.DataFrame({"close": close})
    res = run_ma_crossover_backtest(df, fast=20, slow=50)

    assert "total_return" in res.metrics
    assert "sharpe" in res.metrics
    assert "max_drawdown" in res.metrics
    assert res.curve["equity"].iloc[-1] > 0.9  # sanity
    assert len(res.curve) > 100