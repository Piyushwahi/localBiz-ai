# 🏪 LocalBiz AI

**Multi-Agent AI System for Evidence-Based Local Business Location Analysis**

LocalBiz AI helps aspiring entrepreneurs find the best location for their local business using real Azure Maps geographic data and a 9-agent AI debate system — without guaranteeing success or fabricating data.

---

## ✨ Features

- 🗺️ **Azure Maps Integration** — Real geographic data: POIs, competitors, routes, geocoding (server-side only)
- 🤖 **9 AI Agents** — Location, Competition, Market, Finance, Accessibility, Critic, Fact Checker, Judge — all on a single GPT-5-mini deployment
- ⚔️ **Multi-Round Debate** — Agents challenge each other's conclusions with structured critique
- 🔵 **Fact Checker** — Verifies every agent claim against actual Azure Maps data
- 🔴 **Red Search Zone** — Visual search radius on interactive map
- 📊 **Evidence Classification** — VERIFIED | CALCULATED | AI_INFERENCE | UNKNOWN
- ❓ **Why Not Here?** — Detailed critique for every candidate
- 🔄 **Find Alternatives** — Generate additional candidates on demand
- ⚖️ **Compare Candidates** — Side-by-side evidence comparison
- 🔒 **Security First** — Azure credentials never exposed to the browser

---

## 🏗️ Architecture

```
React (Vite + Tailwind + Azure Maps SDK)
    ↕ Axios (no Azure keys)
FastAPI (Python)
    ├── Azure Maps REST API (subscription key server-side)
    └── Azure AI Foundry → GPT-5-mini (Entra ID auth)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Azure Maps Web SDK 3, Axios, React Router 6, Lucide React |
| Backend | Python 3.11+, FastAPI, Pydantic v2, httpx, python-dotenv |
| AI | Azure AI Foundry, azure-ai-projects, azure-identity, OpenAI client |
| Maps | Azure Maps REST API (geocoding, POI search, routing) |

---

## ☁️ Azure Services Required

### 1. Azure Maps
- Create an Azure Maps account in the Azure Portal
- Copy the **subscription key** (Primary Key)
- Set as `AZURE_MAPS_KEY` in `.env`

### 2. Azure AI Foundry
- Create an Azure AI Foundry project
- Deploy a **GPT-5-mini** model (or gpt-4o-mini)
- Copy the **project endpoint**: `https://<service>.services.ai.azure.com/api/projects/<project>`
- Set as `FOUNDRY_PROJECT_ENDPOINT` in `.env`
- Set the deployment name as `FOUNDRY_MODEL_DEPLOYMENT`

### 3. Azure Authentication
Choose one of:
- **Service Principal** (recommended for local dev): Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
- **DefaultAzureCredential**: Azure CLI login (`az login`) — works if credentials env vars are absent

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` in the `backend/` folder and fill in values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|---|---|---|
| `AZURE_MAPS_KEY` | ✅ Yes | Azure Maps subscription key — **server-side only, never in browser** |
| `FOUNDRY_PROJECT_ENDPOINT` | ✅ Yes | Azure AI Foundry project endpoint URL |
| `FOUNDRY_MODEL_DEPLOYMENT` | ✅ Yes | GPT-5-mini deployment name (default: `gpt-4o-mini`) |
| `AZURE_TENANT_ID` | ⭐ Recommended | Azure AD tenant ID for service principal auth |
| `AZURE_CLIENT_ID` | ⭐ Recommended | Service principal app/client ID |
| `AZURE_CLIENT_SECRET` | ⭐ Recommended | Service principal client secret |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins (default: localhost:5173,3000) |
| `DEMO_MODE` | Optional | Set to `true` to enable clearly-labelled static demo data |

> ⚠️ **Security**: Never commit `.env` to version control. The `.gitignore` excludes it automatically.
> Never put Azure credentials in React/JavaScript.

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Azure Maps account
- Azure AI Foundry project with GPT-5-mini deployed

### Backend Setup

```bash
# Navigate to backend
cd localbiz-ai/backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment variables
copy .env.example .env
# Edit .env with your Azure credentials
```

### Frontend Setup

```bash
# Navigate to frontend
cd localbiz-ai/frontend

# Install dependencies
npm install
```

---

## ▶️ Running Locally

### 1. Start the Backend

```bash
cd localbiz-ai/backend

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 2. Start the Frontend

```bash
cd localbiz-ai/frontend

npm run dev
```

Frontend will be available at: `http://localhost:5173`

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`.

### 3. Verify Everything Works

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "azure_maps_configured": true,
  "foundry_configured": true,
  "demo_mode": false,
  "model_deployment": "gpt-4o-mini"
}
```

---

## 🗺️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check and configuration status |
| POST | `/api/location/search` | Geocode an address → coordinates |
| POST | `/api/location/analyze` | Start full analysis (returns analysis_id) |
| GET | `/api/location/{id}` | Get analysis status and summary |
| GET | `/api/candidates/{id}` | Get generated candidates |
| POST | `/api/candidates/{id}/alternatives` | Generate alternative candidates |
| POST | `/api/debate/{id}/start` | Trigger debate (auto-runs with analysis) |
| GET | `/api/debate/{id}` | Get debate events and agent outputs |
| GET | `/api/analysis/{id}` | Get complete analysis with final report |
| GET | `/api/analysis/{id}/pois` | Get POIs (with optional category filter) |

---

## 🤖 Agent Architecture

All 9 agents share a **single GPT-5-mini deployment**. No separate Azure Agent deployments are created.

| Agent | Role |
|---|---|
| 🎯 Orchestrator | Controls workflow, validates data, coordinates debate |
| 📍 Location Agent | Geographic context, coordinates, accessibility |
| ⚔️ Competition Agent | Competitor count, density, nearest competitors |
| 📊 Market Agent | Demand indicators from actual POI categories |
| 💰 Finance Agent | Available financial context (mostly UNKNOWN) |
| 🚗 Accessibility Agent | Route distance, transit, parking indicators |
| 🔴 Critic Agent | Challenges unsupported/overconfident conclusions |
| 🔵 Fact Checker | Verifies claims against Azure Maps data |
| ⚖️ Judge Agent | Final balanced synthesis |

---

## 💬 Debate Workflow

```
Round 1: Specialist agents analyze independently (parallel)
    ↓
Round 2: Critic challenges conclusions
    ↓
Specialist agents can revise
    ↓
Fact Checker verifies all claims against Azure Maps data
    ↓
Judge synthesizes final report
```

---

## 🔒 Security

- `AZURE_MAPS_KEY` is never sent to the browser
- `AZURE_CLIENT_SECRET` is never sent to the browser
- All Azure API calls are server-side (FastAPI)
- React only communicates with `/api/*` endpoints
- `.env` files are excluded from git via `.gitignore`
- Azure Maps Web SDK in browser uses anonymous tile rendering

---

## 🎯 Responsible AI

LocalBiz AI uses evidence-based language throughout:
- ✅ "Currently has the strongest evidence profile"
- ✅ "Merits further investigation"
- ✅ "Evidence suggests"
- ✅ "Requires physical verification"
- ❌ "Will succeed" — NEVER used
- ❌ "Guaranteed" — NEVER used

AI Analysis Scores (0-10) reflect evidence quality and profile strength — NOT success probability.

---

## 🔧 Troubleshooting

### "Azure Maps is not configured"
- Verify `AZURE_MAPS_KEY` is set in `backend/.env`
- Restart the FastAPI server after changing `.env`

### "Azure AI Foundry is not configured"
- Verify `FOUNDRY_PROJECT_ENDPOINT` is set
- Verify `FOUNDRY_MODEL_DEPLOYMENT` matches your deployment name in the Foundry portal
- Ensure your service principal has the required Foundry role

### "Address not found"
- Azure Maps could not geocode the address
- Try a more specific address (include city/country)
- Verify `AZURE_MAPS_KEY` is valid

### "Analysis failed"
- Check FastAPI logs for the specific error
- Verify all Azure credentials are correct
- Ensure the Foundry endpoint format is: `https://<service>.services.ai.azure.com/api/projects/<project>`

### Frontend shows "Config Required" in navbar
- At least one Azure service is not configured
- Check `GET /api/health` response for which service is missing

---

## 💰 Cost Optimization

- **MAX_CANDIDATES = 5**: Limits GPT invocations per analysis
- **MAX_DEBATE_ROUNDS = 2**: Limits total rounds
- **Parallel execution**: Specialist agents run concurrently (asyncio.gather)
- **Session cache**: Azure Maps data cached in memory per session
- **Python for math**: All distances, counts, filtering done in Python — no GPT tokens used
- **GPT only for**: Reasoning, interpretation, critique, synthesis

---

## 📁 Project Structure

```
localbiz-ai/
├── .gitignore
├── .env.example
├── README.md
├── docs/
│   ├── 01-problem-and-solution.md
│   ├── 02-functionality.md
│   └── 03-architecture-and-agent-workflow.md
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx, main.jsx, index.css
│       ├── components/ (MapView, SearchPanel, CandidateCard, ...)
│       ├── pages/ (Dashboard, MapAnalysis, Candidates, Debate, Docs, About)
│       ├── services/ (api.js)
│       └── hooks/ (useAnalysis.js)
└── backend/
    ├── requirements.txt
    └── app/
        ├── main.py, config.py
        ├── schemas/
        ├── azure_maps/ (client, geocoding, search, routes, categories)
        ├── agents/ (9 agents)
        ├── debate/ (orchestrator)
        ├── services/ (analysis_service, cache)
        ├── routes/ (location, candidates, debate, analysis)
        └── utils/ (geo_calc, candidate_generator)
```

---

## 📄 Documentation

See the `docs/` folder for detailed documentation:
- [01-problem-and-solution.md](docs/01-problem-and-solution.md) — Why LocalBiz AI exists
- [02-functionality.md](docs/02-functionality.md) — Complete feature reference
- [03-architecture-and-agent-workflow.md](docs/03-architecture-and-agent-workflow.md) — Technical architecture
