"""
Pydantic request/response schemas for LocalBiz AI API.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


# ─────────────────────────── Enums ───────────────────────────

class BusinessType(str, Enum):
    burger_shop = "burger_shop"
    cafe = "cafe"
    bakery = "bakery"
    restaurant = "restaurant"
    pharmacy = "pharmacy"
    salon = "salon"
    clothing_store = "clothing_store"
    gym = "gym"
    custom = "custom"


class RadiusKm(float, Enum):
    r500m = 0.5
    r1km = 1.0
    r2km = 2.0
    r3km = 3.0
    r5km = 5.0


class EvidenceType(str, Enum):
    VERIFIED = "VERIFIED"
    CALCULATED = "CALCULATED"
    AI_INFERENCE = "AI_INFERENCE"
    UNKNOWN = "UNKNOWN"


class ClaimStatus(str, Enum):
    VERIFIED = "VERIFIED"
    CONTRADICTED = "CONTRADICTED"
    UNSUPPORTED = "UNSUPPORTED"
    UNKNOWN = "UNKNOWN"


class DebateEventType(str, Enum):
    orchestrator = "orchestrator"
    maps = "maps"
    candidate = "candidate"
    agent = "agent"
    critic = "critic"
    revision = "revision"
    fact_check = "fact_check"
    judge = "judge"
    complete = "complete"
    error = "error"


# ─────────────────────────── Requests ───────────────────────────

class AddressSearchRequest(BaseModel):
    address: str = Field(..., min_length=3, max_length=500)


class AnalyzeRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    business_type: BusinessType = BusinessType.burger_shop
    radius_km: float = Field(default=2.0, ge=0.5, le=5.0)
    custom_business_name: Optional[str] = Field(default=None, max_length=100)

    @field_validator("radius_km")
    @classmethod
    def validate_radius(cls, v):
        allowed = [0.5, 1.0, 2.0, 3.0, 5.0]
        if v not in allowed:
            raise ValueError(f"Radius must be one of {allowed}")
        return v


class FindAlternativesRequest(BaseModel):
    analysis_id: str
    exclude_candidate_ids: List[str] = Field(default_factory=list)


# ─────────────────────────── POI / Geographic ───────────────────────────

class Coordinates(BaseModel):
    latitude: float
    longitude: float


class POI(BaseModel):
    id: str
    name: str
    category: str
    category_code: Optional[str] = None
    coordinates: Coordinates
    distance_m: Optional[float] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    evidence_type: EvidenceType = EvidenceType.VERIFIED


class RouteInfo(BaseModel):
    straight_line_km: float
    driving_km: Optional[float] = None
    driving_minutes: Optional[float] = None
    walking_km: Optional[float] = None
    walking_minutes: Optional[float] = None
    evidence: EvidenceType = EvidenceType.CALCULATED


# ─────────────────────────── Candidates ───────────────────────────

class Candidate(BaseModel):
    id: str
    label: str  # e.g. "Candidate A"
    coordinates: Coordinates
    route_info: RouteInfo
    nearby_pois: List[POI] = Field(default_factory=list)
    poi_summary: Dict[str, int] = Field(default_factory=dict)  # category -> count
    competitor_count: int = 0
    competitors: List[POI] = Field(default_factory=list)
    note: str = "AI-generated candidate area"
    geographic_profile: str = ""  # e.g. "Commercial + High competition"
    nearest_landmark: Optional[str] = None
    anchor_landmarks: List[str] = Field(default_factory=list)
    opportunity_level: Optional[str] = None  # e.g. "Uncontested Market (Blue Ocean)" | "Balanced Demand" | "High Saturation"
    formatted_address: Optional[str] = None
    estimated_footfall_tier: Optional[str] = None
    prime_trading_hours: Optional[str] = None
    commercial_rent_tier: Optional[str] = None


# ─────────────────────────── Agent Outputs ───────────────────────────

class AgentClaim(BaseModel):
    claim: str
    classification: EvidenceType
    evidence_ids: List[str] = Field(default_factory=list)
    fact_check_status: Optional[ClaimStatus] = None


class AgentOutput(BaseModel):
    agent: str
    candidate_id: str
    claims: List[AgentClaim] = Field(default_factory=list)
    analysis: str
    risks: List[str] = Field(default_factory=list)
    unknowns: List[str] = Field(default_factory=list)
    confidence: str = "medium"  # low | medium | high
    score: Optional[float] = None  # 0-10


class CriticChallenge(BaseModel):
    target_agent: str
    candidate_id: str
    challenged_claims: List[str]
    reasoning: str
    severity: str = "medium"  # low | medium | high


class FactCheckResult(BaseModel):
    claim: str
    status: ClaimStatus
    actual_value: Optional[str] = None
    reasoning: str


class JudgeReport(BaseModel):
    candidate_id: str
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    uncertainties: List[str]
    items_requiring_physical_verification: List[str]
    ai_analysis_score: float = Field(..., ge=0, le=10)
    score_disclaimer: str = (
        "AI Analysis Score reflects evidence quality and profile strength only. "
        "It is NOT a success probability or guarantee."
    )
    recommendation: str  # e.g. "Merits further investigation"
    evidence_quality: str  # high | medium | low
    executive_verdict: Optional[str] = None
    bull_case: Optional[str] = None
    bear_case: Optional[str] = None
    actionable_recommendations: List[str] = Field(default_factory=list)
    target_customer_segments: List[str] = Field(default_factory=list)
    competitive_advantage: Optional[str] = None
    scores_breakdown: Dict[str, float] = Field(default_factory=dict)


class FinalReport(BaseModel):
    analysis_id: str
    recommended_candidate_id: Optional[str] = None
    recommendation_phrase: str
    candidate_reports: List[JudgeReport]
    debate_summary: str
    fact_check_summary: str
    responsible_ai_notice: str = (
        "This analysis is evidence-based decision support only. "
        "It does NOT guarantee business success. "
        "All information requiring physical verification must be independently confirmed."
    )


# ─────────────────────────── Debate ───────────────────────────

class DebateEvent(BaseModel):
    id: str
    timestamp: str
    event_type: DebateEventType
    agent: Optional[str] = None
    candidate_id: Optional[str] = None
    message: str
    detail: Optional[str] = None
    status: str = "info"  # info | success | warning | error


class DebateState(BaseModel):
    analysis_id: str
    status: str = "pending"  # pending | running | complete | error
    current_round: int = 0
    events: List[DebateEvent] = Field(default_factory=list)
    specialist_outputs: Dict[str, List[AgentOutput]] = Field(default_factory=dict)
    critic_challenges: List[CriticChallenge] = Field(default_factory=list)
    fact_check_results: Dict[str, List[FactCheckResult]] = Field(default_factory=dict)
    final_report: Optional[FinalReport] = None


# ─────────────────────────── Analysis Session ───────────────────────────

class AnalysisSession(BaseModel):
    analysis_id: str
    status: str = "pending"  # pending | maps_fetching | generating_candidates | debating | complete | error
    request: AnalyzeRequest
    home_coordinates: Coordinates
    home_address: Optional[str] = None
    geographic_data: Dict[str, Any] = Field(default_factory=dict)
    pois: List[POI] = Field(default_factory=list)
    candidates: List[Candidate] = Field(default_factory=list)
    debate: Optional[DebateState] = None
    final_report: Optional[FinalReport] = None
    error_message: Optional[str] = None
    demo_mode: bool = False


# ─────────────────────────── API Responses ───────────────────────────

class AddressSearchResponse(BaseModel):
    address: str
    coordinates: Coordinates
    confidence: str = "high"


class AnalyzeResponse(BaseModel):
    analysis_id: str
    status: str
    message: str
    home_coordinates: Optional[Coordinates] = None
    home_address: Optional[str] = None
    poi_count: int = 0
    candidate_count: int = 0
    pois: List[POI] = Field(default_factory=list)
    candidates: List[Candidate] = Field(default_factory=list)
    debate: Optional[DebateState] = None
    final_report: Optional[FinalReport] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    azure_maps_configured: bool
    foundry_configured: bool
    demo_mode: bool
