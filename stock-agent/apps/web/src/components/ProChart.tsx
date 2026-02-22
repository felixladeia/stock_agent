"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { OhlcvResponse } from "../lib/ohlcv";
import type { IndicatorsResponse } from "../lib/indicators";

// react-plotly.js must be dynamically imported (no SSR)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  ohlcv: OhlcvResponse;
  ind: IndicatorsResponse;
};

export function ProChart({ ohlcv, ind }: Props) {
  // Align by timestamp intersection (robust when indicators drop warmup rows)
  const aligned = useMemo(() => {
    const priceMap = new Map<string, { o: number; h: number; l: number; c: number; v: number }>();
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

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>
        {ticker} — Candles + Volume + RSI + MACD
      </h3>

      <Plot
        data={[
          // 1) Candlesticks (Row 1)
          {
            type: "candlestick",
            x: aligned.t,
            open: aligned.o,
            high: aligned.h,
            low: aligned.l,
            close: aligned.c,
            name: "Price",
            xaxis: "x",
            yaxis: "y",
          },

          // 2) Volume (Row 2)
          {
            type: "bar",
            x: aligned.t,
            y: aligned.v,
            name: "Volume",
            xaxis: "x",
            yaxis: "y2",
            opacity: 0.5,
          },

          // 3) RSI (Row 3)
          {
            type: "scatter",
            mode: "lines",
            x: aligned.t,
            y: aligned.rsi,
            name: "RSI(14)",
            xaxis: "x",
            yaxis: "y3",
          },
          // RSI guides at 70/30 (optional)
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
          },

          // 4) MACD (Row 4) - histogram + lines
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
          },
        ]}
        layout={{
          height: 820,
          margin: { l: 50, r: 20, t: 30, b: 40 },

          // One shared x-axis for all rows
          xaxis: {
            type: "date",
            rangeslider: { visible: false },
            showgrid: false,
          },

          // Stacked layout using domains
          yaxis: {
            domain: [0.52, 1.0],
            title: "Price",
            fixedrange: false,
          },
          yaxis2: {
            domain: [0.42, 0.52],
            title: "Vol",
            fixedrange: false,
          },
          yaxis3: {
            domain: [0.22, 0.42],
            title: "RSI",
            range: [0, 100],
            fixedrange: false,
          },
          yaxis4: {
            domain: [0.0, 0.22],
            title: "MACD",
            fixedrange: false,
          },

          legend: { orientation: "h" },
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}