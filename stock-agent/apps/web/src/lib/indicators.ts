import { z } from "zod";

export const IndicatorsResponseSchema = z.object({
  ticker: z.string(),
  interval: z.string(),
  t: z.array(z.string()),
  rsi_14: z.array(z.number()),
  macd: z.array(z.number()),
  macd_signal: z.array(z.number()),
  macd_hist: z.array(z.number()),
  vol_20: z.array(z.number()),
});

export type IndicatorsResponse = z.infer<typeof IndicatorsResponseSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchIndicators(ticker: string, lookbackYears = 2): Promise<IndicatorsResponse> {
  const res = await fetch(
    `${API_URL}/indicators?ticker=${encodeURIComponent(ticker)}&lookback_years=${lookbackYears}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Indicators API error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return IndicatorsResponseSchema.parse(json);
}