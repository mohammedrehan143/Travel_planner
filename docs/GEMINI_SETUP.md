# Google Gemini LLM Integration & Setup Guide

TripPilot AI provides first-class support for **Google Gemini** as the autonomous, tool-calling Agentic AI brain.

---

## 1. Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API key"** (or select an existing Google Cloud Project).
4. Copy the generated key (it starts with `AIzaSy...`).

---

## 2. Configuration

Open [`backend/.env`](file:///D:/skills_lab/Travel_planner/backend/.env) (or copy from [`backend/.env.example`](file:///D:/skills_lab/Travel_planner/backend/.env.example)) and set:

```env
# ----------------------------------------------------------------------
# Google Gemini Configuration
# ----------------------------------------------------------------------
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
GEMINI_MODEL=gemini-2.5-flash
AI_PROVIDER=gemini
```

---

## 3. Supported Models

| Model Identifier | Latency | Accuracy / Tool Calling | Recommended Use |
|---|---|---|---|
| `gemini-2.5-flash` | ⚡ Ultra-fast | ⭐⭐⭐⭐⭐ (Excellent) | **Default recommended** for production & dev |
| `gemini-1.5-flash` | ⚡ Fast | ⭐⭐⭐⭐ (Very good) | Great for budget/free tier quotas |
| `gemini-1.5-pro` | 🐢 Slower | ⭐⭐⭐⭐⭐ (Elite) | Complex reasoning and intricate itineraries |
| `gemini-2.0-flash` | ⚡ Fast | ⭐⭐⭐⭐⭐ (Latest preview) | Experimental 2.0 workloads |

To switch models, simply change `GEMINI_MODEL` in [`backend/.env`](file:///D:/skills_lab/Travel_planner/backend/.env):
```env
GEMINI_MODEL=gemini-1.5-flash
```

---

## 4. How It Works Under the Hood

TripPilot AI supports Gemini through two integrated SDKs:

### A. Official OpenAI-Compatible REST Gateway
Google Gemini natively hosts an OpenAI-compatible API at:
`https://generativelanguage.googleapis.com/v1beta/openai/`

In [`backend/src/agent/llm.client.ts`](file:///D:/skills_lab/Travel_planner/backend/src/agent/llm.client.ts):
```typescript
openaiClient = new OpenAI({
  apiKey: env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});
```
This enables Gemini to call all 10 tools using standard JSON function calling schemas without modifying any tool interfaces!

### B. Official `@google/genai` SDK
The newly installed `@google/genai` (v2.30.0) SDK provides direct access to Google GenAI for native multi-modal content generation via:
```typescript
import { generateWithGemini } from './agent/llm.client.js';

const tip = await generateWithGemini('Provide 3 local travel tips for Tokyo in autumn.');
```

---

## 5. Offline & Testing Fallback

If `GEMINI_API_KEY` is omitted or empty (e.g., in CI/CD pipelines or local offline tests):
- The server **does not crash**.
- The agent automatically routes to the **Deterministic Heuristic Orchestrator**.
- All 10 tools, geographic clustering, weather lookups, and validations execute with 100% fidelity using verified destination data!

---

## 6. Verifying the Connection

Run the automated test suite:
```bash
cd backend
npm test
```
You should see:
```text
✓ tests/gemini.test.ts (2 tests)
...
Test Files  6 passed (6)
Tests       35 passed (35)
```

Start the dev server:
```bash
npm run dev
```
Check the console startup banner:
```text
=======================================================
🚀 TripPilot AI Backend & Agentic Service
📡 Server running on http://localhost:5000
🌍 Environment: development
🤖 Agentic AI Provider: Google Gemini (gemini-2.5-flash)
=======================================================
```
