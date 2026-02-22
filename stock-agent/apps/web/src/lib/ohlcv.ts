import { z } from "zod";

export const OhlcvResponseSchema = z.object({
  ticker: z.string(),
  interval: z.string(),
  t: z.array(z.string()),
  o: z.array(z.number()),
  h: z.array(z.number()),
  l: z.array(z.number()),
  c: z.array(z.number()),
  v: z.array(z.number()),
});

export type OhlcvResponse = z.infer<typeof OhlcvResponseSchema>;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchOhlcv(
  ticker: string,
  lookbackYears = 2
): Promise<OhlcvResponse> {
  const res = await fetch(
    `${API_URL}/ohlcv?ticker=${encodeURIComponent(
      ticker
    )}&lookback_years=${lookbackYears}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OHLCV API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return OhlcvResponseSchema.parse(json);
}