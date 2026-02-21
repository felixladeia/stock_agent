from __future__ import annotations
from typing import Literal, Any
from pydantic import BaseModel, Field

Signal = Literal["BUY", "SELL", "HOLD"]

class Constraints(BaseModel):
    max_position_pct: float = Field(default=0.10, ge=0.0, le=1.0)
    max_daily_loss_pct: float = Field(default=0.02, ge=0.0, le=1.0)

class AnalyzeRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=12)
    horizon_days: int = Field(default=20, ge=1, le=365)
    as_of: str | None = None  # ISO date string "YYYY-MM-DD" (optional for now)
    constraints: Constraints = Field(default_factory=Constraints)

class EvidenceItem(BaseModel):
    type: Literal["news", "numeric", "note"]
    title: str
    source: str
    published_at: str | None = None
    snippet: str | None = None
    doc_id: str | None = None

class RiskBlock(BaseModel):
    stop_loss_pct: float = Field(..., ge=0.0, le=1.0)
    take_profit_pct: float = Field(..., ge=0.0, le=3.0)
    invalidators: list[str] = Field(default_factory=list)

class Provenance(BaseModel):
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    retrieved_doc_ids: list[str] = Field(default_factory=list)
    data_windows: dict[str, Any] = Field(default_factory=dict)

class AnalyzeResponse(BaseModel):
    ticker: str
    signal: Signal
    confidence: float = Field(..., ge=0.0, le=1.0)
    horizon_days: int
    thesis_bullets: list[str]
    numeric_features: dict[str, float] = Field(default_factory=dict)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    risk: RiskBlock
    provenance: Provenance
