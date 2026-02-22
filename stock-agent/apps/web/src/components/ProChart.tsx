"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { OhlcvResponse } from "../lib/ohlcv";
import type { IndicatorsResponse } from "../lib/indicators";
import type { AnalyzeResponse } from "../lib/schemas";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  ohlcv: OhlcvResponse;
  ind: IndicatorsResponse;
  analysis?: AnalyzeResponse | null;
};

function sma(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null);
  if (window <= 1) return values.map((v) => v);

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

function slopeLastN(series: (number | null)[], n: number): number | null {
  // slope = (last - first)/n using last n non-null points
  const pts: number[] = [];
  for (let i = series.length - 1; i >= 0 && pts.length < n; i--) {
    const v = series[i];
    if (v != null && Number.isFinite(v)) pts.push(v);
  }
  if (pts.length < n) return null;
  const last = pts[0];
  const first = pts[pts.length - 1];
  return (last - first) / n;
}

function fmtPct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

export function ProChart({ ohlcv, ind, analysis }: Props) {
  const [show, setShow] = useState({
    candles: true,
    volume: true,
    mas: true,
    crossovers: true,
    rsi: true,
    macd: true,
    signalMarker: true,
    regimeShading: true,
  });

  // Align by timestamp intersection (robust when indicators drop warmup rows)
  const aligned = useMemo(() => {
    const priceMap = new Map<
      string,
      { o: number; h: number; l: number; c: number; v: number }
    >();
    for (let i = 0; i < ohlcv.t.length; i++) {
      priceMap.set(ohlcv.t[i], {
        o: ohlcv.o[i],
        h: ohlcv.h[i],
        l: ohlcv.l[i],
        c: ohlcv.c[i],
        v: ohlcv.v[i],
      });
    }

    const t: string[] = [];
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const c: number[] = [];
    const v: number[] = [];

    const rsi: number[] = [];
    const macd: number[] = [];
    const macdSig: number[] = [];
    const macdHist: number[] = [];

    for (let i = 0; i < ind.t.length; i++) {
      const ti = ind.t[i];
      const p = priceMap.get(ti);
      if (!p) continue;

      t.push(ti);
      o.push(p.o);
      h.push(p.h);
      l.push(p.l);
      c.push(p.c);
      v.push(p.v);

      rsi.push(ind.rsi_14[i]);
      macd.push(ind.macd[i]);
      macdSig.push(ind.macd_signal[i]);
      macdHist.push(ind.macd_hist[i]);
    }

    return { t, o, h, l, c, v, rsi, macd, macdSig, macdHist };
  }, [ohlcv, ind]);

  const ticker = ohlcv.ticker;

  const ma = useMemo(() => {
    const sma20 = sma(aligned.c, 20);
    const sma50 = sma(aligned.c, 50);

    const bullX: { x: string; y: number }[] = [];
    const bearX: { x: string; y: number }[] = [];

    for (let i = 1; i < aligned.t.length; i++) {
      const a0 = sma20[i - 1];
      const b0 = sma50[i - 1];
      const a1 = sma20[i];
      const b1 = sma50[i];

      if (a0 == null || b0 == null || a1 == null || b1 == null) continue;

      const prev = a0 - b0;
      const curr = a1 - b1;

      if (prev <= 0 && curr > 0) bullX.push({ x: aligned.t[i], y: aligned.c[i] });
      else if (prev >= 0 && curr < 0) bearX.push({ x: aligned.t[i], y: aligned.c[i] });
    }

    const s20 = slopeLastN(sma20, 10);
    const s50 = slopeLastN(sma50, 10);

    // small threshold to avoid noise (scale with price)
    const lastClose = aligned.c.length ? aligned.c[aligned.c.length - 1] : 1;
    const eps = lastClose * 0.0005; // ~0.05% of price per 10 bars

    const last20 = sma20[sma20.length - 1];
    const last50 = sma50[sma50.length - 1];

    let regime: "BULL" | "BEAR" | "SIDEWAYS" = "SIDEWAYS";
    if (last20 != null && last50 != null && s20 != null && s50 != null) {
      const up = s20 > eps && s50 > eps;
      const down = s20 < -eps && s50 < -eps;

      if (last20 > last50 && up) regime = "BULL";
      else if (last20 < last50 && down) regime = "BEAR";
      else regime = "SIDEWAYS";
    }

    return { sma20, sma50, bullX, bearX, s20, s50, regime };
  }, [aligned]);

  // Latest signal marker (plots at last candle close)
  const latestSignal = analysis?.signal ?? null;
  const lastIdx = aligned.t.length - 1;
  const lastX = lastIdx >= 0 ? aligned.t[lastIdx] : null;
  const lastClose = lastIdx >= 0 ? aligned.c[lastIdx] : null;

  const signalMarkerTrace =
    show.signalMarker && lastX && lastClose && latestSignal
      ? [
          {
            type: "scatter",
            mode: "markers+text",
            x: [lastX],
            y: [lastClose],
            xaxis: "x",
            yaxis: "y",
            name: `Signal: ${latestSignal}`,
            text: [latestSignal],
            textposition: "top center",
            marker: {
              size: 12,
              symbol:
                latestSignal === "BUY"
                  ? "triangle-up"
                  : latestSignal === "SELL"
                  ? "triangle-down"
                  : "circle",
              color:
                latestSignal === "BUY"
                  ? "#16a34a"
                  : latestSignal === "SELL"
                  ? "#dc2626"
                  : "#6b7280",
            },
          },
        ]
      : [];

  const shapes = useMemo(() => {
    if (!show.regimeShading || aligned.t.length < 2) return [];

    // Shade only the PRICE panel domain with a subtle fill (paper coords)
    const fill =
      ma.regime === "BULL"
        ? "rgba(22,163,74,0.06)"
        : ma.regime === "BEAR"
        ? "rgba(220,38,38,0.06)"
        : "rgba(107,114,128,0.05)";

    return [
      {
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: aligned.t[0],
        x1: aligned.t[aligned.t.length - 1],
        y0: 0.54, // matches yaxis domain start
        y1: 1.0,  // matches yaxis domain end
        fillcolor: fill,
        line: { width: 0 },
        layer: "below",
      },
    ];
  }, [show.regimeShading, aligned.t, ma.regime]);

  const regimeChip = useMemo(() => {
    const label = ma.regime;
    const slope20 = ma.s20 == null ? "n/a" : (ma.s20 > 0 ? "↑" : ma.s20 < 0 ? "↓" : "→");
    const slope50 = ma.s50 == null ? "n/a" : (ma.s50 > 0 ? "↑" : ma.s50 < 0 ? "↓" : "→");
    return { label, slope20, slope50 };
  }, [ma.regime, ma.s20, ma.s50]);

  // Build traces conditionally
  const traces: any[] = [];

  if (show.candles) {
    traces.push({
      type: "candlestick",
      x: aligned.t,
      open: aligned.o,
      high: aligned.h,
      low: aligned.l,
      close: aligned.c,
      name: "Price",
      xaxis: "x",
      yaxis: "y",
    });
  }

  if (show.mas) {
    traces.push(
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: ma.sma20,
        name: "SMA 20",
        xaxis: "x",
        yaxis: "y",
      },
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: ma.sma50,
        name: "SMA 50",
        xaxis: "x",
        yaxis: "y",
      },
    );
  }

  if (show.crossovers) {
    traces.push(
      {
        type: "scatter",
        mode: "markers",
        x: ma.bullX.map((p) => p.x),
        y: ma.bullX.map((p) => p.y),
        name: "Bull cross (20>50)",
        xaxis: "x",
        yaxis: "y",
        marker: { symbol: "triangle-up", size: 9, color: "#16a34a" },
      },
      {
        type: "scatter",
        mode: "markers",
        x: ma.bearX.map((p) => p.x),
        y: ma.bearX.map((p) => p.y),
        name: "Bear cross (20<50)",
        xaxis: "x",
        yaxis: "y",
        marker: { symbol: "triangle-down", size: 9, color: "#dc2626" },
      }
    );
  }

  traces.push(...signalMarkerTrace);

  if (show.volume) {
    traces.push({
      type: "bar",
      x: aligned.t,
      y: aligned.v,
      name: "Volume",
      xaxis: "x",
      yaxis: "y2",
      opacity: 0.5,
    });
  }

  if (show.rsi) {
    traces.push(
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: aligned.rsi,
        name: "RSI(14)",
        xaxis: "x",
        yaxis: "y3",
      },
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: aligned.t.map(() => 70),
        name: "RSI 70",
        xaxis: "x",
        yaxis: "y3",
        hoverinfo: "skip",
        line: { dash: "dot" },
        opacity: 0.7,
      },
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: aligned.t.map(() => 30),
        name: "RSI 30",
        xaxis: "x",
        yaxis: "y3",
        hoverinfo: "skip",
        line: { dash: "dot" },
        opacity: 0.7,
      }
    );
  }

  if (show.macd) {
    traces.push(
      {
        type: "bar",
        x: aligned.t,
        y: aligned.macdHist,
        name: "MACD Hist",
        xaxis: "x",
        yaxis: "y4",
        opacity: 0.6,
      },
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: aligned.macd,
        name: "MACD",
        xaxis: "x",
        yaxis: "y4",
      },
      {
        type: "scatter",
        mode: "lines",
        x: aligned.t,
        y: aligned.macdSig,
        name: "Signal",
        xaxis: "x",
        yaxis: "y4",
      }
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h3 style={{ marginBottom: 8 }}>
          {ticker} — Pro Chart
        </h3>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 999,
            padding: "6px 10px",
            fontSize: 12,
            opacity: 0.9,
            whiteSpace: "nowrap",
          }}
          title="Regime is derived from SMA20 vs SMA50 and their slopes (last ~10 bars)."
        >
          Regime: <strong>{regimeChip.label}</strong> • SMA20 {regimeChip.slope20} • SMA50 {regimeChip.slope50}
        </div>
      </div>

      {/* Toggles */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        {(
          [
            ["candles", "Candles"],
            ["volume", "Volume"],
            ["mas", "MAs (20/50)"],
            ["crossovers", "Crossovers"],
            ["rsi", "RSI"],
            ["macd", "MACD"],
            ["signalMarker", "Signal marker"],
            ["regimeShading", "Regime shading"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={(show as any)[key]}
              onChange={(e) => setShow((s) => ({ ...s, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>

      <Plot
        data={traces}
        layout={{
          height: 880,
          margin: { l: 50, r: 20, t: 20, b: 40 },
          xaxis: { type: "date", rangeslider: { visible: false }, showgrid: false },

          // Domains: keep fixed layout even if some panels hidden (simpler).
          // If you want dynamic resizing when panels are hidden, we can do that next.
          yaxis: { domain: [0.54, 1.0], title: "Price", fixedrange: false },
          yaxis2: { domain: [0.44, 0.54], title: "Vol", fixedrange: false },
          yaxis3: { domain: [0.22, 0.44], title: "RSI", range: [0, 100], fixedrange: false },
          yaxis4: { domain: [0.0, 0.22], title: "MACD", fixedrange: false },

          legend: { orientation: "h" },
          shapes,
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}