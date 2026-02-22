"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { IndicatorsResponse } from "../lib/indicators";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function IndicatorsChart({ data }: { data: IndicatorsResponse }) {
  const x = data.t;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Indicators</h3>

      {/* RSI */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h4 style={{ margin: 0 }}>RSI (14)</h4>
          <span style={{ opacity: 0.7 }}>{data.ticker} • {data.interval}</span>
        </div>

        <Plot
          data={[
            {
              type: "scatter",
              mode: "lines",
              x,
              y: data.rsi_14,
              name: "RSI(14)",
            },
            // Optional guide lines at 30/70
            {
              type: "scatter",
              mode: "lines",
              x,
              y: x.map(() => 70),
              name: "70",
              hoverinfo: "skip",
              line: { dash: "dot" },
            },
            {
              type: "scatter",
              mode: "lines",
              x,
              y: x.map(() => 30),
              name: "30",
              hoverinfo: "skip",
              line: { dash: "dot" },
            },
          ]}
          layout={{
            height: 260,
            margin: { l: 40, r: 20, t: 20, b: 40 },
            yaxis: { range: [0, 100], title: "RSI" },
            xaxis: { rangeslider: { visible: false } },
            legend: { orientation: "h" },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
        />
      </div>

      {/* MACD */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h4 style={{ margin: 0 }}>MACD</h4>
          <span style={{ opacity: 0.7 }}>{data.ticker} • {data.interval}</span>
        </div>

        <Plot
          data={[
            {
              type: "bar",
              x,
              y: data.macd_hist,
              name: "Histogram",
              opacity: 0.6,
            },
            {
              type: "scatter",
              mode: "lines",
              x,
              y: data.macd,
              name: "MACD",
            },
            {
              type: "scatter",
              mode: "lines",
              x,
              y: data.macd_signal,
              name: "Signal",
            },
          ]}
          layout={{
            height: 320,
            margin: { l: 40, r: 20, t: 20, b: 40 },
            xaxis: { rangeslider: { visible: false } },
            yaxis: { title: "MACD" },
            barmode: "overlay",
            legend: { orientation: "h" },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}