import { z } from "zod";

export const EvidenceItemSchema = z.object({
  type: z.enum(["news", "numeric", "note"]),
  title: z.string(),
  source: z.string(),
  published_at: z.string().nullable().optional(),
  snippet: z.string().nullable().optional(),
  doc_id: z.string().nullable().optional(),
});

export const AnalyzeResponseSchema = z.object({
  ticker: z.string(),
  signal: z.enum(["BUY", "SELL", "HOLD"]),
  confidence: z.number().min(0).max(1),
  horizon_days: z.number().int(),
  thesis_bullets: z.array(z.string()),
  numeric_features: z.record(z.number()),
  evidence: z.array(EvidenceItemSchema),
  risk: z.object({
    stop_loss_pct: z.number(),
    take_profit_pct: z.number(),
    invalidators: z.array(z.string()),
  }),
  provenance: z.object({
    tool_calls: z.array(z.record(z.any())),
    retrieved_doc_ids: z.array(z.string()),
    data_windows: z.record(z.any()),
  }),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
