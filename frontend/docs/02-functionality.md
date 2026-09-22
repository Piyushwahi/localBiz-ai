# LocalBiz AI — Functionality

## Overview

LocalBiz AI provides a complete evidence-based location analysis workflow. This document describes every major feature: what it does, why it exists, its input, processing, and output.

---

## 1. Location Selection

**What**: Users select their home or preferred starting point on the map.

**Why**: The search radius and candidate generation are centered on this point.

**Input options**:
- Text address (e.g., "123 Main St, Lahore")
- Browser geolocation (if permission granted)
- Click directly on the map

**Processing**:
- Text address → `POST /api/location/search` → FastAPI → Azure Maps Geocoding API
- Browser geolocation → coordinates sent directly to backend
- Map click → coordinates captured from Azure Maps Web SDK click event

**Output**: `{ latitude, longitude, formatted_address }` with `VERIFIED` classification

---

## 2. Business Type Selection

**What**: User selects from: Burger Shop, Cafe, Bakery, Restaurant, Pharmacy, Salon, Clothing Store, Gym, Custom Business.

**Why**: The business type determines:
- Which POI categories to search for competitors
- What demand indicator categories are relevant

**Processing**: Maps to competitor keyword sets (e.g., "burger_shop" → ["burger", "fast food", "hamburger", "mcdonald", "kfc"])

---

## 3. Radius Selection

**What**: User selects search radius: 500m, 1km, 2km, 3km, 5km.

**Why**: Defines the geographic scope. Smaller radius = more focused. Larger = more alternatives.

**Default**: 2 km

---

## 4. Red Search Zone

**What**: A red translucent circle rendered on the Azure Maps Web SDK map.

**Why**: Provides immediate visual context — the user sees exactly where the analysis applies.

**Label**: "SEARCH ZONE — 2 km" (or configured radius)

**Implementation**: Azure Maps BubbleLayer centered on home coordinates with radius in meters.

---

## 5. Azure Maps Integration

**What**: All geographic/business data is retrieved from the Azure Maps REST API.

**Why**: Ensures that no geographic data is fabricated. Every POI, distance, and route is from a trusted source.

**Note**: All calls are server-side (FastAPI). The Azure Maps subscription key is NEVER exposed to the React frontend.

**APIs used**:
- `GET /search/address/json` — geocoding
- `GET /search/address/reverse/json` — reverse geocoding
- `GET /search/fuzzy/json` — multi-category POI search
- `GET /search/nearby/json` — nearby POI search
- `GET /route/directions/json` — driving/walking routes

---

## 6. POI Discovery

**What**: Concurrent multi-category search of the entire search area.

**Why**: Builds a comprehensive picture of what actually exists in the area.

**Processing**:
- System searches 15+ category keywords concurrently using asyncio.gather
- Results are deduplicated by POI ID
- Categories are dynamically extracted from actual results — not assumed

**Output**: List of POIs with: name, category, coordinates, distance, address (all VERIFIED)

**Important**: The system adapts to what actually exists. If there are no colleges in an area, colleges will not appear in the analysis.

---

## 7. Competitor Discovery

**What**: Identifies direct competitors by filtering POIs using business-type-specific keywords.

**Why**: Competitor count and density are critical signals for location selection.

**Processing**: Python keyword matching against POI names and categories (no GPT involved)

**Output**: List of competitor POIs with VERIFIED classification

---

## 8. Candidate Generation

**What**: Generates 3–5 candidate areas distributed within the search zone.

**Why**: Provides the user with diverse options to evaluate, not just one recommendation.

**Method**:
- Candidates placed at evenly distributed bearings (0°, 72°, 144°, 216°, 288°)
- Distance from home varies (35%–75% of radius) to ensure geographic diversity
- Each candidate is assigned nearby POIs from the fetched dataset

**Labels**: Always labelled "AI-generated candidate area" — these are analytical zones, not confirmed commercial properties.

**Diversity strategy**: Candidates represent different geographic conditions (high competition, low competition, residential, commercial, transit-oriented).

---

## 9. Distance Calculation

**What**: Straight-line distance from home to each candidate.

**Method**: Haversine formula implemented in Python (`geo_calc.py`).

**Classification**: CALCULATED (derived from VERIFIED coordinates)

**Display**: "0.84 km (straight-line)"

**Note**: GPT is never asked to calculate distances.

---

## 10. Route Calculation

**What**: Driving and walking route distance and travel time.

**Source**: Azure Maps Routing API (`/route/directions/json`)

**Classification**: VERIFIED (from Azure Maps response)

**Display**:
- "Driving: 1.2 km | 8 min"
- "Walking: 0.9 km | 11 min"
- If unavailable: "UNKNOWN"

**Note**: Route data is never invented. If Azure Maps does not return a route, the value is UNKNOWN.

---

## 11. Agent Analysis (5 Specialist Agents)

All agents receive structured JSON containing actual Azure Maps data.

### Location Agent
- **Analyzes**: Coordinates, distances, route info, geographic context, nearby POI mix
- **Output**: Location suitability assessment with claims classified as VERIFIED/CALCULATED/AI_INFERENCE

### Competition Agent
- **Analyzes**: Direct competitors (from Azure Maps), competitor density, nearest competitor distance
- **Output**: Competition landscape assessment with VERIFIED counts

### Market Agent
- **Analyzes**: Demand indicators from actually-present POI categories ONLY
- **Critical rule**: Does NOT assume any category exists; only analyzes what is in the data
- **Output**: Demand assessment with explicit caveats that indicators ≠ proven customers

### Finance Agent
- **Analyzes**: Available financial context (usually very limited)
- **Critical rule**: NEVER invents rent, revenue, or profit figures — all labeled UNKNOWN
- **Output**: Financial evidence quality assessment with physical verification list

### Accessibility Agent
- **Analyzes**: Route distance, transit proximity, parking indicators from available data
- **Output**: Accessibility assessment using only available data

---

## 12. Debate (2–3 Rounds)

**What**: A structured multi-round debate between agents.

**Why**: A single agent produces a single perspective. Debate exposes weak assumptions.

**Round 1**: All 5 specialist agents analyze independently in parallel (asyncio.gather)

**Round 2**: Critic challenges all conclusions; specialist agents can revise

**Round 3** (optional): Additional revision if needed

---

## 13. Critic Agent

**What**: Challenges unsupported, overconfident, or contradictory conclusions.

**Why**: The most important responsible AI mechanism — prevents hallucinated confidence.

**Examples of what it challenges**:
- "Colleges nearby = strong demand" → "Challenge: Presence of colleges is only a demand indicator"
- "This location will succeed" → "Challenge: No evidence supports outcome prediction"
- Contradictions between agents
- Claims without VERIFIED evidence

**Output**: List of challenges with severity (low/medium/high) and specific claims challenged

---

## 14. Fact Checker

**What**: Verifies every agent claim against the actual Azure Maps data.

**Status values**:
- `VERIFIED`: Azure Maps data confirms the claim
- `CONTRADICTED`: Azure Maps data contradicts the claim
- `UNSUPPORTED`: Cannot confirm or deny from available data
- `UNKNOWN`: No relevant data to check against

**Example**:
- Claim: "There are 5 burger competitors" — Actual data: 4 → CONTRADICTED

---

## 15. Judge (Synthesis Agent)

**What**: Produces the final balanced analysis for each candidate.

**Receives**: All specialist outputs, critic challenges, fact check results

**Output structure**:
- Summary paragraph (evidence-based language)
- Strengths list
- Weaknesses list
- Uncertainties list
- Items requiring physical verification
- AI Analysis Score (0-10) — NOT a success probability
- Recommendation phrase (evidence-based only)
- Evidence quality rating

**Critical rule**: Never claims guaranteed success. Uses only:
- "Currently has the strongest evidence profile"
- "Merits further investigation"
- "Evidence suggests"
- "Requires physical verification"

---

## 16. Candidate Comparison

**What**: Side-by-side comparison of up to 3 candidates.

**Shows**: Distance, competition count, demand indicators, accessibility, evidence quality, risks, unknowns, AI Analysis Score

**Access**: "Compare" button on Candidates page or Map Analysis panel

---

## 17. WHY NOT HERE?

**What**: Modal showing all concerns about a specific candidate.

**Shows**:
- Competition concerns
- Missing demand evidence
- Accessibility concerns
- Financial uncertainty
- Evidence gaps
- Critic objections (with specific challenged claims)
- Fact-check results (especially CONTRADICTED claims)

**Access**: "Why Not?" button on every candidate card

---

## 18. FIND ALTERNATIVES

**What**: Generates additional candidate areas not previously shown.

**Process**:
1. New candidates generated with different bearings/distances
2. Existing candidates excluded
3. New candidates assigned from existing POI dataset
4. New candidates appear on map and in candidate list

**Access**: "Alternatives" button in Map Analysis panel

---

## 19. Debate Timeline

**What**: Live chronological feed of all debate events.

**Shows**: Timestamp, event type, agent name, message, detail

**Events**: Orchestrator start, Azure Maps data retrieval, candidate generation, agent analysis, critic challenge, revision, fact check, judge synthesis, completion

**Purpose**: The user can see exactly HOW the final assessment was formed — transparent reasoning.

---

## 20. Evidence Classification

Every important data point is classified:

| Label | Meaning | Example |
|---|---|---|
| `VERIFIED` | Directly from Azure Maps | "6 competitors found" |
| `CALCULATED` | Computed from verified data | "Distance = 0.72 km (Haversine)" |
| `AI_INFERENCE` | Agent interpretation | "Office proximity may indicate lunch demand" |
| `UNKNOWN` | Not available in data | "Commercial rent: UNKNOWN" |

---

## 21. Unknown Information

Any information not available in the data is explicitly labeled UNKNOWN. This includes:
- Commercial rent (always UNKNOWN unless provided)
- Property availability (always UNKNOWN)
- Actual foot traffic counts (UNKNOWN)
- Local business license requirements (UNKNOWN)
- Physical site conditions (UNKNOWN)

Financial data is almost always UNKNOWN. The Finance Agent explicitly reports this rather than inventing figures.

---

## 22. Final Report

The final report includes:
- Recommended candidate (highest AI Analysis Score)
- Candidate-by-candidate judge reports
- Debate summary
- Fact check summary
- Responsible AI notice
- Items requiring physical verification

**Responsible AI notice** (always included):
> "This analysis is evidence-based decision support only. It does NOT guarantee business success. All information requiring physical verification must be independently confirmed."
