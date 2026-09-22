# LocalBiz AI Presentation Plan

## Presentation Title

**LocalBiz AI: Finding Better Business Locations with Azure Maps and AI**

## One-Sentence Project Explanation

LocalBiz AI helps a business owner compare possible locations using real map data and several AI agents that check and discuss the evidence.

## Team Division

| Member | Main responsibility | Presentation part |
|---|---|---|
| Member 1 | Problem, solution, and overall architecture | Why this project is needed and how all parts connect |
| Member 2 | AI agents and debate | What each agent does and how the final recommendation is made |
| Member 3 | FastAPI and API connection | How the frontend, backend, Azure Maps, and AI communicate |
| Member 4 | Azure Maps location and search | Geocoding, search zones, POIs, and competitors |
| Member 5 | Azure Maps routes, candidates, and result display | Routes, candidate areas, map results, security, and limitations |

This division gives two members the AI/API work and three members the Azure Maps work.

---

## Member 1: Problem, Solution, and Architecture

### Slide 1: The Problem

**Simple explanation:**

Choosing a business location is difficult. A business owner needs to think about competition, customer demand, travel access, rent, and the surrounding area. Looking only at a busy street or choosing a familiar place can lead to a bad decision.

**Say this:**

> Imagine someone wants to open a burger shop. They need to know where competitors are, whether customers may be nearby, how easy the place is to reach, and what information is still missing. Doing all of this manually takes a lot of time and can include personal bias.

### Slide 2: Problems with a Single AI Answer

- It may invent competitor numbers or rent prices.
- It may not have current geographic information.
- It gives only one point of view.
- It may sound confident even when evidence is missing.

### Slide 3: Our Solution

LocalBiz AI solves this by:

1. Getting real geographic data from Azure Maps.
2. Creating several possible candidate areas.
3. Asking different AI agents to study each candidate.
4. Using a Critic and Fact Checker to find weak or incorrect claims.
5. Using a Judge agent to prepare a balanced final report.

### Slide 4: Simple Architecture

```text
User in React frontend
        |
        | HTTP requests
        v
FastAPI backend
   |              |
   |              +--> Azure Maps REST APIs
   |
   +-----------------> Azure AI Foundry / GPT model
                          |
                          v
               Specialist agents, Critic,
               Fact Checker, and Judge
        |
        v
Map, candidate cards, and debate results
```

**Say this:**

> The browser collects the user's request and displays the results. FastAPI is the middle layer. It calls Azure Maps for geographic facts and Azure AI Foundry for reasoning. The browser never receives secret Azure keys.

### Member 1 Closing Line

> The main idea is simple: use real location data first, then use multiple AI opinions to understand that data responsibly.

---

## Member 2: AI Agents and Debate

### Slide 5: The Nine Agents

The system has nine cooperating parts:

| Agent or part | Easy explanation |
|---|---|
| Orchestrator | Controls the order of the analysis |
| Location Agent | Studies the area's geographic context and distance |
| Competition Agent | Counts and studies direct competitors |
| Market Agent | Studies demand indicators such as schools, offices, and hospitals |
| Finance Agent | Lists financial information and clearly marks missing data |
| Accessibility Agent | Studies walking, driving, transit, and parking information |
| Critic Agent | Challenges weak or overconfident conclusions |
| Fact Checker | Compares agent claims with the real map data |
| Judge Agent | Combines the results into a final balanced report |

### Slide 6: How the Debate Works

1. The five specialist agents work in parallel.
2. Each agent gives claims, risks, unknowns, and a score.
3. The Critic looks for unsupported claims and contradictions.
4. The Fact Checker checks claims against the Azure Maps results.
5. The Judge weighs the evidence and writes the final report.

**Example:**

> The Market Agent may say that three colleges could indicate student demand. The Critic reminds us that colleges do not prove that students will buy from the new shop. The Judge reports this as a possibility, not a guarantee.

### Slide 7: Evidence Labels

Every important statement uses one of four labels:

- **VERIFIED:** Directly returned by Azure Maps.
- **CALCULATED:** Computed from verified data, such as distance.
- **AI_INFERENCE:** A reasonable interpretation, not a proven fact.
- **UNKNOWN:** Information the system does not have.

### Slide 8: Responsible AI

- The system never promises business success.
- It does not invent rent, revenue, or profit numbers.
- It shows weaknesses and missing information.
- It tells the user what to verify during a physical visit.
- The AI score represents evidence quality, not the probability of success.

### Member 2 Closing Line

> The agents do not replace the business owner's decision. They make the decision clearer, more balanced, and easier to verify.

---

## Member 3: FastAPI and API Connection

### Slide 9: Why We Use a Backend

The React frontend talks only to our FastAPI backend. The backend talks to Azure services.

This gives us:

- Secure storage of the Azure Maps subscription key.
- Secure Azure AI authentication.
- One place for validation and business logic.
- A clean API for the frontend.
- Better control over errors, retries, and background analysis.

### Slide 10: Important API Flow

```text
1. User enters address, business type, and radius.
2. React sends POST /api/location/analyze.
3. FastAPI creates an analysis ID.
4. FastAPI gets coordinates and map data.
5. FastAPI starts candidate and agent analysis.
6. React checks the analysis and debate endpoints.
7. React displays the map, candidates, and final report.
```

### Slide 11: Main API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Checks whether the backend and services are configured |
| `POST /api/location/search` | Converts an address into coordinates |
| `POST /api/location/analyze` | Starts the complete analysis |
| `GET /api/location/{id}` | Gets analysis status and summary |
| `GET /api/candidates/{id}` | Gets candidate areas |
| `GET /api/debate/{id}` | Gets debate events and agent outputs |
| `GET /api/analysis/{id}` | Gets the complete final analysis |
| `GET /api/analysis/{id}/pois` | Gets map places found in the area |

### Slide 12: Backend Modules in Simple Terms

- **Routes:** Receive frontend requests.
- **Schemas:** Validate request and response data.
- **Services:** Run the main analysis process and cache results.
- **Azure Maps modules:** Call geocoding, search, and route APIs.
- **Agents:** Analyze the structured data.
- **Debate Orchestrator:** Runs the agent workflow.

### Member 3 Closing Line

> FastAPI connects every part of the system. It keeps the frontend simple and makes sure that sensitive keys and important logic stay on the server.

---

## Member 4: Azure Maps Location and Search

### Slide 13: Starting Location

The user can:

- Type an address.
- Use browser location.
- Click on the map.

For an address, Azure Maps Geocoding converts the text into latitude, longitude, and a formatted address. This result is marked **VERIFIED**.

### Slide 14: Search Zone

The user selects a radius such as 500 meters, 1 kilometer, or 2 kilometers. The frontend shows this area as a red circle on the map.

This makes it clear which area the system is analyzing.

### Slide 15: POI Search

POI means **Point of Interest**. Examples include:

- Restaurants and shops.
- Schools and colleges.
- Offices and hospitals.
- Transit stops and parking areas.

The backend searches many categories at the same time, removes duplicate results, and stores the name, category, address, coordinates, and distance.

### Slide 16: Competitor Discovery

The selected business type decides which keywords are used. For a burger shop, examples include burger, fast food, hamburger, and restaurant.

The system counts competitors using the returned map data. It does not ask the AI to invent competitor names or counts.

### Member 4 Closing Line

> Azure Maps gives us the real-world facts about the area. These facts become the evidence used by the rest of the system.

---

## Member 5: Azure Maps Routes, Candidates, and Results

### Slide 17: Route Information

Azure Maps can provide:

- Driving distance and time.
- Walking distance and time.
- Reverse geocoding from coordinates back to an address.

If a route is not available, the system shows **UNKNOWN** instead of guessing.

### Slide 18: Candidate Areas

The system creates three to five candidate areas inside the search zone.

- Candidates are placed at different directions.
- Their distances from the starting point are varied.
- Each candidate receives nearby POI and competitor data.
- A candidate is an analytical area, not a confirmed available property.

This gives the user multiple choices instead of one automatic answer.

### Slide 19: What the User Sees

The frontend displays:

- A map with the search zone and POI markers.
- Candidate cards with strengths and weaknesses.
- Side-by-side candidate comparison.
- A debate timeline showing agent activity.
- Evidence badges.
- A **Why Not Here?** view showing risks and unanswered questions.

### Slide 20: Security and Limitations

**Security:**

- Azure Maps keys stay in the FastAPI backend.
- Azure AI credentials stay in the backend.
- React communicates through `/api` endpoints only.

**Limitations:**

- The system does not know exact rent unless another source provides it.
- It cannot prove real foot traffic.
- It cannot confirm property availability.
- It does not replace site visits or professional advice.

### Member 5 Closing Line

> The final result is a shortlist for further investigation. It is decision support, not a promise that a business will succeed.

---

## Full Demo Story

Use this example while presenting:

> A user wants to open a burger shop in Lahore. They enter an address, choose Burger Shop, and select a 2-kilometer radius. Azure Maps finds the location, competitors, schools, offices, routes, and other places. The system creates five candidate areas. The specialist agents analyze each one. The Critic challenges unsupported claims, and the Fact Checker compares claims with the actual map data. Finally, the Judge explains which candidate has the strongest evidence profile, what its risks are, and what the user must verify in person.

## Final Conclusion

> LocalBiz AI combines Azure Maps, FastAPI, and multi-agent AI to make local business location research more organized and evidence-based. It does not make the decision for the user. It helps the user understand the choices, the evidence, and the unknowns before spending money.

## Short Questions and Answers

### Why use multiple agents?

Different agents study different parts of the problem. The Critic and Fact Checker also reduce unsupported conclusions.

### Can the system guarantee success?

No. Business success depends on factors such as rent, service quality, pricing, and real customer behavior. The system only reports the available evidence.

### Why is Azure Maps important?

It provides real coordinates, places, competitors, and route information instead of relying only on AI guesses.

### Why are some values marked UNKNOWN?

The system is designed to be honest. It marks missing information instead of inventing it.

### What should the user do after the analysis?

Visit the strongest candidate areas, check rent and availability, observe foot traffic at different times, and confirm local rules.

---

## Final Points: Azure AI Foundry

### What Is Azure AI Foundry?

Azure AI Foundry is Microsoft's platform for building and using AI applications. It gives us access to an AI model and the tools needed to connect that model to our application.

### How We Use It in LocalBiz AI

- We use an Azure AI Foundry project as the AI service for the backend.
- We use one deployed GPT model for all of our agents.
- The same model performs different jobs because each agent has a different role and instruction.
- FastAPI sends structured location and Azure Maps data to the agents.
- The agents return structured JSON containing claims, scores, risks, and unknowns.
- The Critic, Fact Checker, and Judge use the earlier agent results to continue the workflow.

### What Work We Completed with Azure AI Foundry

1. Connected the FastAPI backend to the Azure AI Foundry project.
2. Configured the model deployment and secure Azure authentication.
3. Created prompts for the Location, Competition, Market, Finance, and Accessibility agents.
4. Created the Critic agent to challenge weak or overconfident claims.
5. Created the Fact Checker to compare AI claims with Azure Maps data.
6. Created the Judge agent to prepare the final evidence-based report.
7. Added JSON validation, retries, and a fallback analysis path for service problems.
8. Connected the debate results to the React screens and candidate comparison views.

### Simple Presentation Explanation

> Azure Maps tells us what is actually present in the area. Azure AI Foundry helps our agents understand that information. It does not replace the map data. It reasons over the data, checks different viewpoints, and prepares a clear report for the user.

### Important Point

> Azure AI Foundry does not guarantee that a business will succeed. It helps us organize and analyze evidence. Unknown values such as rent, real foot traffic, and property availability remain unknown and must be checked by the user.