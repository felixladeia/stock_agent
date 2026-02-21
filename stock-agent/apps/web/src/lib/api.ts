import { AnalyzeResponseSchema, type AnalyzeResponse } from "./schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyze(ticker: string, horizonDays: number): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticker,
      horizon_days: horizonDays,
      constraints: { max_position_pct: 0.1, max_daily_loss_pct: 0.02 }
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return AnalyzeResponseSchema.parse(json);
}
