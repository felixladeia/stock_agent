from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any
import numpy as np
import pandas as pd


@dataclass
class BacktestResult:
    metrics: Dict[str, Any]
    curve: pd.DataFrame  # columns: equity, benchmark, position, strat_ret, bh_ret


def _sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window).mean()


def _max_drawdown(equity: pd.Series) -> float:
    peak = equity.cummax()
    dd = (equity / peak) - 1.0
    return float(dd.min())


def run_ma_crossover_backtest(
    df: pd.DataFrame,
    fast: int = 20,
    slow: int = 50,
    trading_days: int = 252,
) -> BacktestResult:
    """
    Deterministic MA crossover backtest:
      - long when SMA(fast) > SMA(slow)
      - flat otherwise
      - position shifted by 1 bar to avoid lookahead bias
    Expects df with 'close' and DatetimeIndex.
    """
    if "close" not in df.columns:
        raise ValueError("df must contain 'close' column")
    if fast < 2 or slow < 2 or fast >= slow:
        raise ValueError("Require: 2 <= fast < slow")

    px = df["close"].astype(float).copy()
    ret = px.pct_change().fillna(0.0)

    sma_fast = _sma(px, fast)
    sma_slow = _sma(px, slow)

    raw_signal = (sma_fast > sma_slow).astype(int)  # 1 long else 0
    position = raw_signal.shift(1).fillna(0).astype(int)  # avoid lookahead

    strat_ret = ret * position
    bh_ret = ret

    equity = (1.0 + strat_ret).cumprod()
    benchmark = (1.0 + bh_ret).cumprod()

    # Drop warmup rows where MAs are NaN (keep curves aligned)
    valid = ~(sma_fast.isna() | sma_slow.isna())
    equity = equity[valid]
    benchmark = benchmark[valid]
    position = position[valid]
    strat_ret = strat_ret[valid]
    bh_ret = bh_ret[valid]

    if len(equity) < slow + 5:
        raise ValueError("Not enough data after warmup to backtest")

    total_return = float(equity.iloc[-1] - 1.0)
    total_return_bh = float(benchmark.iloc[-1] - 1.0)

    # Annualization
    n = len(equity)
    years = n / trading_days if trading_days > 0 else 0
    cagr = float(equity.iloc[-1] ** (1.0 / years) - 1.0) if years > 0 else float("nan")
    cagr_bh = float(benchmark.iloc[-1] ** (1.0 / years) - 1.0) if years > 0 else float("nan")

    # Sharpe (simple, rf=0)
    mu = strat_ret.mean()
    sig = strat_ret.std(ddof=0)
    sharpe = float(np.sqrt(trading_days) * (mu / sig)) if sig > 0 else 0.0

    mu_bh = bh_ret.mean()
    sig_bh = bh_ret.std(ddof=0)
    sharpe_bh = float(np.sqrt(trading_days) * (mu_bh / sig_bh)) if sig_bh > 0 else 0.0

    mdd = _max_drawdown(equity)
    mdd_bh = _max_drawdown(benchmark)

    # Trades: count entries (0->1)
    entries = int(((position.shift(1).fillna(0) == 0) & (position == 1)).sum())

    curve = pd.DataFrame(
        {
            "equity": equity,
            "benchmark": benchmark,
            "position": position.astype(int),
            "strat_ret": strat_ret,
            "bh_ret": bh_ret,
        }
    )

    metrics = {
        "strategy": {"type": "ma_crossover", "fast": fast, "slow": slow},
        "n_bars": int(n),
        "total_return": total_return,
        "cagr": cagr,
        "sharpe": sharpe,
        "max_drawdown": mdd,
        "trades": {"entries": entries},
        "benchmark": {
            "total_return": total_return_bh,
            "cagr": cagr_bh,
            "sharpe": sharpe_bh,
            "max_drawdown": mdd_bh,
        },
    }

    return BacktestResult(metrics=metrics, curve=curve)