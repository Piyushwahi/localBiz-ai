/**
 * Docs page — renders the three documentation files as in-app content.
 */
import { useState } from 'react'
import { BookOpen, FileText, Cpu } from 'lucide-react'

const DOC_TABS = [
  { id: 'problem', icon: FileText, label: 'Problem & Solution' },
  { id: 'functionality', icon: BookOpen, label: 'Functionality' },
  { id: 'architecture', icon: Cpu, label: 'Architecture' },
]

const PROBLEM_CONTENT = `
# LocalBiz AI — Problem & Solution

## The Real-World Problem
Every year, thousands of aspiring entrepreneurs open local businesses — burger shops, cafes, bakeries, pharmacies — often choosing a location based on gut feeling, proximity to home, or simple convenience. Statistically, a large percentage of these businesses fail within the first few years. Location is one of the most critical factors determining success or failure.

## Why Choosing a Location is Difficult
Choosing the right location requires balancing multiple competing factors:
- **Competition**: How many direct competitors are nearby?
- **Demand indicators**: Are there enough potential customers in the area?
- **Accessibility**: Can customers easily reach the location by foot, car, or transit?
- **Financial viability**: What is the realistic rent and operating cost?
- **Geographic context**: Is this a commercial zone, residential area, or transit corridor?

A single person cannot simultaneously research all of these dimensions with sufficient depth.

## Problems with Intuition-Based Decisions
Human intuition tends to be anchored to familiar areas and biased toward locations we already know. We overlook hidden opportunities in adjacent neighborhoods, underestimate competition density, or misjudge foot traffic patterns. A single AI response is equally limited — it cannot verify its own claims against real geographic data.

## LocalBiz AI Solution
LocalBiz AI is a multi-agent AI system that:
1. Retrieves **real geographic data** from Azure Maps (competitor locations, schools, offices, transit, etc.)
2. Generates multiple candidate areas within a user-defined search radius
3. Deploys **9 specialized AI agents** that independently analyze each candidate
4. Runs a **structured debate** where agents challenge each other's conclusions
5. Applies a **Fact Checker** that verifies claims against actual data
6. Produces a **Judge synthesis** with transparent, balanced evidence

## Who Uses It
- Aspiring local business owners
- Small business consultants
- Urban planners and researchers
- Anyone making evidence-based location decisions

## Example: Burger Shop
*"I want to open a burger shop near my home in Lahore."*

1. User enters their home address → system geocodes it
2. User selects **2 km** radius → red search zone appears on map
3. Azure Maps returns: 6 existing burger restaurants, 3 schools, 2 offices, 1 hospital, multiple residential streets
4. System generates **5 candidate areas** at different bearings
5. Agents analyze each: competition density, school/office demand, transit access, unknown financial data
6. Critic challenges: *"The presence of offices is only a demand indicator, not proven customer conversion"*
7. Fact Checker: *"Agent claimed 5 competitors — Azure Maps data shows 6. CONTRADICTED."*
8. Judge synthesizes: *"Candidate B currently has the strongest evidence profile based on lower competition and proximity to transit"*

## Responsible AI
LocalBiz AI **never** claims guaranteed business success. Every assessment uses evidence-based language:
- "Evidence suggests" / "Data indicates"
- "Merits further investigation"
- "Requires physical verification"

## Limitations
- Cannot access commercial rent databases
- Cannot measure actual foot traffic
- Cannot assess property availability
- Location analysis is probabilistic, not deterministic

## Expected Outcome
Users receive a structured, transparent evidence package that helps them ask better questions and focus physical verification efforts on the most promising candidate areas.
`

const FUNCTIONALITY_CONTENT = `
# LocalBiz AI — Functionality

## 1. Location Selection
**What**: Users select their home or preferred starting location.
**Why**: The search radius originates from this point.
**Input**: Text address / browser geolocation / map click
**Processing**: Address is geocoded by Azure Maps via FastAPI backend
**Output**: Coordinates (latitude, longitude) with VERIFIED classification

## 2. Business Type Selection
**What**: User selects from predefined business types or enters custom.
**Why**: Determines competitor keywords and demand indicator categories.
**Options**: Burger Shop, Cafe, Bakery, Restaurant, Pharmacy, Salon, Clothing Store, Gym, Custom

## 3. Radius Selection
**What**: User selects search radius (500m, 1km, 2km, 3km, 5km)
**Why**: Defines the geographic scope of the analysis.
**Default**: 2 km

## 4. Red Search Zone
**What**: A red translucent circle rendered on the Azure Maps SDK map.
**Why**: Visually communicates the analysis scope to the user.
**Label**: "SEARCH ZONE"

## 5. Azure Maps Integration
**What**: All geographic data is retrieved from Azure Maps.
**Why**: Ensures no fabricated geographic data. Every POI is VERIFIED.
**Note**: All calls are server-side. The subscription key is never exposed to the browser.

## 6. POI Discovery
**What**: Concurrent multi-category search within the radius.
**Categories returned**: Dynamically determined by actual data (restaurants, schools, offices, transit, etc.)
**Why**: Adapts to what actually exists in the area.

## 7. Competitor Discovery
**What**: Filters returned POIs using business-type-specific keywords.
**Why**: Competitor count is a key market signal.
**Classification**: VERIFIED (from Azure Maps)

## 8. Candidate Generation
**What**: 3–5 candidate areas generated within the search zone.
**Method**: Geometric distribution at varying bearings and distances.
**Label**: Always labelled "AI-generated candidate area" — not confirmed properties.

## 9. Distance Calculation
**What**: Straight-line distance from home to each candidate.
**Method**: Haversine formula in Python.
**Classification**: CALCULATED

## 10. Route Calculation
**What**: Driving and walking route distance/time from home.
**Source**: Azure Maps Routing API.
**Classification**: VERIFIED

## 11. Agent Analysis (5 Specialists)
- **Location Agent**: Geographic context, accessibility indicators
- **Competition Agent**: Competitor count, density, nearest competitors
- **Market Agent**: Demand indicators from actual POI categories
- **Finance Agent**: Available financial context (mostly UNKNOWN)
- **Accessibility Agent**: Route distance, transit proximity, parking

## 12. Debate
**What**: 2 rounds of structured multi-agent debate.
**Round 1**: All specialist agents analyze independently
**Round 2**: Critic challenges conclusions, specialists can revise

## 13. Critic
**What**: Challenges unsupported, overconfident, or contradictory conclusions.
**Example**: "Colleges nearby is only a demand indicator, not proven customer conversion."

## 14. Fact Checker
**What**: Verifies every agent claim against Azure Maps data.
**Results**: VERIFIED / CONTRADICTED / UNSUPPORTED / UNKNOWN

## 15. Judge
**What**: Synthesizes all agent outputs into a final balanced report.
**Output**: Strengths, weaknesses, uncertainties, physical verification requirements, AI Analysis Score

## 16. Candidate Comparison
**What**: Side-by-side comparison of up to 3 candidates.
**Shows**: Distance, competition, demand, accessibility, evidence quality, risks, unknowns

## 17. WHY NOT HERE?
**What**: Opens a modal showing all concerns about a candidate.
**Shows**: Competition concerns, critic objections, fact-check failures, evidence gaps, physical verification requirements

## 18. FIND ALTERNATIVES
**What**: Generates additional candidate areas with different placements.
**Why**: Allows users to explore beyond the initial set.

## 19. Debate Timeline
**What**: Live event feed showing every agent action.
**Shows**: Timestamps, agent names, event type, details.

## 20. Evidence Classification
Every claim is tagged: VERIFIED | CALCULATED | AI_INFERENCE | UNKNOWN

## 21. Unknown Information
Any information not available in the data is explicitly labelled UNKNOWN.
Financial data (rent, revenue, profit) is always UNKNOWN unless verified.

## 22. Final Report
A complete structured analysis with responsible AI notice:
"Information requiring physical verification" is always explicitly listed.
`

const ARCHITECTURE_CONTENT = `
# LocalBiz AI — Architecture & Agent Workflow

## Frontend
- **React + Vite**: SPA with hot reload
- **Tailwind CSS**: Utility-first styling
- **Azure Maps Web SDK**: Map tiles and markers (no API key in browser)
- **Axios**: All API calls go to FastAPI backend
- **React Router**: Client-side routing

## Backend
- **FastAPI**: Async Python API server
- **Pydantic v2**: Strict input/output validation
- **httpx**: Async HTTP client for Azure Maps REST API
- **azure-identity**: DefaultAzureCredential for Foundry auth
- **azure-ai-projects**: AIProjectClient → get_openai_client() → GPT-5-mini

## Azure Services
- **Azure Maps**: Geocoding, POI search, route calculation (server-side only)
- **Azure AI Foundry**: Single GPT-5-mini deployment shared by all agents

## Data Flow
\`\`\`
React → FastAPI → Azure Maps (geocoding, POI search, routing)
                → Candidate Generator (Python/Haversine)
                → DebateOrchestrator
                    → Location Agent (GPT-5-mini)
                    → Competition Agent (GPT-5-mini)
                    → Market Agent (GPT-5-mini)
                    → Finance Agent (GPT-5-mini)
                    → Accessibility Agent (GPT-5-mini)
                → Critic Agent (challenges all conclusions)
                → Fact Checker (verifies against Azure Maps data)
                → Judge Agent (final synthesis)
        → React (map + candidate cards + timeline)
\`\`\`

## Agent Message Format

### Orchestrator → Specialist Agents
\`\`\`json
{
  "candidate_id": "candidate_a",
  "coordinates": { "latitude": 31.634, "longitude": 74.872 },
  "route_info": { "straight_line_km": 0.72, "driving_km": 1.1 },
  "poi_summary": { "restaurant": 3, "school": 2, "office": 5 },
  "competitor_count": 3,
  "competitors": [{"name": "Burger Palace", "category": "burger"}]
}
\`\`\`

### Specialist Agent → Orchestrator
\`\`\`json
{
  "agent": "competition",
  "candidate_id": "candidate_a",
  "claims": [
    { "claim": "3 direct competitors within 400m", "classification": "VERIFIED" }
  ],
  "analysis": "Evidence suggests moderate competition...",
  "risks": ["High competition density may limit market share"],
  "unknowns": ["Actual foot traffic unknown"],
  "confidence": "medium",
  "score": 6.5
}
\`\`\`

### Critic Agent Output
\`\`\`json
{
  "challenges": [
    {
      "target_agent": "market",
      "challenged_claims": ["Nearby schools indicate strong demand"],
      "reasoning": "Schools are a demand indicator only, not proven customer conversion",
      "severity": "medium"
    }
  ]
}
\`\`\`

### Fact Checker Output
\`\`\`json
{
  "fact_checks": [
    {
      "claim": "5 burger competitors",
      "status": "CONTRADICTED",
      "actual_value": "4 competitors in Azure Maps data",
      "reasoning": "Agent overstated competitor count by 1"
    }
  ]
}
\`\`\`

### Judge Final Report
\`\`\`json
{
  "candidate_id": "candidate_b",
  "summary": "Candidate B currently has the strongest evidence profile...",
  "strengths": ["Low competition", "Transit proximity"],
  "weaknesses": ["Limited demand indicators", "Residential area only"],
  "uncertainties": ["Actual rent UNKNOWN", "Foot traffic UNKNOWN"],
  "items_requiring_physical_verification": [
    "Commercial rent", "Property availability", "Parking situation"
  ],
  "ai_analysis_score": 7.2,
  "recommendation": "Merits further investigation"
}
\`\`\`

## Security
- AZURE_MAPS_KEY: server-side only, never sent to browser
- AZURE_CLIENT_SECRET: server-side only
- All Azure API calls proxied through FastAPI
- No credentials in JavaScript code
- .env excluded from git
`

const CONTENT_MAP = {
  problem: PROBLEM_CONTENT,
  functionality: FUNCTIONALITY_CONTENT,
  architecture: ARCHITECTURE_CONTENT,
}

function SimpleMarkdown({ content }) {
  const lines = content.trim().split('\n')
  return (
    <div className="max-w-4xl space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-navy-900 mt-6 mb-3 tracking-tight">{line.slice(2)}</h1>
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-primary-700 mt-6 mb-2 border-b border-slate-900/[0.08] pb-1.5">{line.slice(3)}</h2>
        if (line.startsWith('- ')) return <li key={i} className="text-slate-700 text-xs font-medium ml-4 mb-1 list-disc">{line.slice(2)}</li>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-navy-900 text-xs mb-1">{line.slice(2, -2)}</p>
        if (line.startsWith('```')) return null
        if (line.startsWith('*"') || line.startsWith('*')) return <p key={i} className="text-slate-500 text-xs italic mb-2 font-medium">{line.replace(/\*/g, '')}</p>
        if (line.trim() === '') return <div key={i} className="h-1.5" />
        return <p key={i} className="text-slate-700 text-xs font-medium mb-1.5 leading-relaxed">{line}</p>
      })}
    </div>
  )
}

export default function Docs() {
  const [activeTab, setActiveTab] = useState('problem')

  return (
    <div className="flex h-full">
      {/* Tab sidebar */}
      <div className="w-60 flex-shrink-0 bg-cream-50 border-r border-slate-900/[0.08] p-4 space-y-1.5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Documentation</h2>
        {DOC_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`sidebar-item w-full ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        <div className="glass-card p-8 border border-slate-900/[0.08]">
          <SimpleMarkdown content={CONTENT_MAP[activeTab]} />
        </div>
      </div>
    </div>
  )
}
