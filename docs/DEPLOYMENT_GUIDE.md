# TripPilot AI - Production Deployment Guide

This guide provides step-by-step instructions for deploying:
- **Backend (Node.js + Agentic AI Orchestrator)** &rarr; **[Render](https://render.com)**
- **Frontend (React + Vite SPA)** &rarr; **[Vercel](https://vercel.com)**

---

## 1. Deploy Backend to Render

### Method A: One-Click via Render Blueprint (Recommended)
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** &rarr; **Blueprint**.
3. Connect your repository: `https://github.com/mohammedrehan143/Travel_planner`.
4. Render will automatically detect the [`render.yaml`](../render.yaml) file at the root of the repository.
5. In the configuration screen, provide the secret environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - `SUPABASE_URL`: Your Supabase Project URL (`https://xyz.supabase.co`).
   - `SUPABASE_ANON_KEY`: Your Supabase anon key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
6. Click **Apply**.
7. Once deployed, note your service URL (e.g. `https://trippilot-backend.onrender.com`).

### Method B: Manual Web Service Setup on Render
If you prefer creating a Web Service manually:
1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Select your repository.
3. Configure the following fields:
   - **Name**: `trippilot-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: Any (e.g. Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=*
   AI_PROVIDER=auto
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
5. Click **Create Web Service**.
6. Verify deployment by visiting `https://your-backend.onrender.com/health` in your browser. You should receive:
   ```json
   {
     "status": "healthy",
     "service": "TripPilot AI Backend",
     "version": "1.0.0",
     "agentEngine": "active"
   }
   ```

---

## 2. Deploy Frontend to Vercel

### Step-by-Step Vercel Setup
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Select and import your GitHub repository: `mohammedrehan143/Travel_planner`.
4. Configure the project settings:
   - **Project Name**: `trippilot`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend` *(Note: if left as root, the repo-level [`vercel.json`](../vercel.json) also supports building from root).*
   - **Build Command**: `npm run build` (or `tsc && vite build`)
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   ```env
   VITE_BACKEND_URL=https://trippilot-backend.onrender.com
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(Replace with your actual Render backend URL and Supabase credentials).*
6. Click **Deploy**.
7. Vercel will install dependencies, build the TypeScript bundle, and deploy the SPA.

### SPA Routing & Clean URLs
The repository includes [`frontend/vercel.json`](../frontend/vercel.json) with SPA URL rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures refreshing pages like `/dashboard`, `/wizard`, or `/itinerary/123` works without HTTP 404 errors.

---

## 3. Verify the Production Pipeline

1. **Backend Health Check**:
   ```bash
   curl https://your-backend.onrender.com/health
   ```
2. **Frontend Test**:
   - Open your Vercel deployment URL (`https://trippilot.vercel.app`).
   - Click **Create Trip** or **Explore Wizard**.
   - Select Indian Rupee (**INR ₹**) or another preferred currency.
   - Click **Orchestrate Trip with AI Agent** &rarr; verify real-time agent orchestration with live routes, weather, and budget breakdown.
3. **Database Sync**:
   - Navigate to **Dashboard** &rarr; verify the newly created trip appears and persists.
