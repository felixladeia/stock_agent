"use client";

import React, { useState } from "react";
import { analyze } from "../lib/api";
import { fetchOhlcv } from "../lib/ohlcv";
import { fetchIndicators } from "../lib/indicators";
import type { AnalyzeResponse } from "../lib/schemas";
import type { OhlcvResponse } from "../lib/ohlcv";
import type { IndicatorsResponse } from "../lib/indicators";
import { ProChart } from "../components/ProChart";

export default function HomePage() {
  const [ticker, setTicker] = useState("AAPL");
  const [horizon, setHorizon] = useState(20);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [ohlcv, setOhlcv] = useState<OhlcvResponse | null>(null);
  const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onRun() {
    setLoading(true);
    setErr(null);

    try {
      const out = await analyze(ticker, horizon);
      setData(out);

      const candles = await fetchOhlcv(out.ticker, 2);
      setOhlcv(candles);

      const indicators = await fetchIndicators(out.ticker, 2);
      setIndicators(indicators);

    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setData(null);
      setOhlcv(null);
      setIndicators(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Stock Agent (Phase 1 stub)</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
        <label>
          Ticker&nbsp;
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} style={{ padding: 8 }} />
        </label>

        <label>
          Horizon days&nbsp;
          <input
            type="number"
            value={horizon}
            onChange={(e) => setHorizon(parseInt(e.target.value || "20", 10))}
            style={{ padding: 8, width: 100 }}
          />
        </label>

        <button onClick={onRun} disabled={loading} style={{ padding: "8px 12px" }}>
          {loading ? "Running..." : "Analyze"}
        </button>
      </div>

      {err && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <strong>Error:</strong> {err}
        </div>
      )}

      {data && (
        <section style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <h2 style={{ margin: 0 }}>{data.ticker}</h2>
            <span style={{ fontWeight: 700 }}>Signal: {data.signal}</span>
            <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
            <span>Horizon: {data.horizon_days}d</span>
          </div>


          {ohlcv && indicators && <ProChart ohlcv={ohlcv} ind={indicators} />}
          <h3>Thesis</h3>
          <ul>
            {data.thesis_bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>

          <h3>Risk</h3>
          <ul>
            <li>Stop loss: {(data.risk.stop_loss_pct * 100).toFixed(1)}%</li>
            <li>Take profit: {(data.risk.take_profit_pct * 100).toFixed(1)}%</li>
          </ul>
          <details>
            <summary>Invalidators</summary>
            <ul>
              {data.risk.invalidators.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </details>
          <h3>Raw JSON</h3>
          <pre style={{ overflowX: "auto", background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
