# TripPilot AI - Complete Documentation Index

Welcome to the comprehensive technical documentation for **TripPilot AI**.

---

## 📑 Documentation Suite

| Document | Description |
|---|---|
| 📖 [**API Contract**](file:///D:/skills_lab/Travel_planner/docs/API_CONTRACT.md) | Agreed integration contract between Person 1 (Frontend) and Person 2 (Backend). Contains all endpoint schemas, JSON request/response formats, and dev bypass headers. |
| 🏗️ [**Architecture & Design**](file:///D:/skills_lab/Travel_planner/docs/ARCHITECTURE.md) | High-level system architecture, component relationships, data flow diagrams, and security model. |
| 🗄️ [**Database Schema & RLS**](file:///D:/skills_lab/Travel_planner/docs/DATABASE_SCHEMA.md) | Complete PostgreSQL ER diagram, table descriptions, constraints, foreign keys, triggers, and Row Level Security policies. |
| 🤖 [**Agentic AI Specification**](file:///D:/skills_lab/Travel_planner/docs/AGENT_SPEC.md) | 10-step autonomous planning workflow, 10 callable tools, validation engine rules, auto-revision loops, and prompt injection defenses. |
| ⚡ [**Google Gemini Setup Guide**](file:///D:/skills_lab/Travel_planner/docs/GEMINI_SETUP.md) | Step-by-step instructions for getting an API key, choosing Gemini models (`gemini-2.5-flash`), tool calling configuration, and offline fallbacks. |
| 🌍 [**Free Resources Guide (Maps & Weather)**](file:///D:/skills_lab/Travel_planner/docs/FREE_RESOURCES_GUIDE.md) | How TripPilot AI uses 100% free open-source services (Open-Meteo, OpenStreetMap, OSRM, Frankfurter) requiring **NO API keys**. |
| 🎨 [**Person 1 Frontend Handbook**](file:///D:/skills_lab/Travel_planner/docs/PERSON_1_FRONTEND_GUIDE.md) | Ready-to-copy TypeScript API client, UI tasks mapping, polling wizard status, and development bypass tokens. |
| 🧪 [**Testing & Verification**](file:///D:/skills_lab/Travel_planner/docs/TESTING_GUIDE.md) | Vitest test suite breakdown (36 tests across 6 files), test execution commands, and coverage details. |
| 🚀 [**Production Deployment Guide**](file:///D:/skills_lab/Travel_planner/docs/DEPLOYMENT_GUIDE.md) | Step-by-step instructions for deploying Backend to **Render** and Frontend to **Vercel** with full environment variable setup. |
| 💻 [**Backend Quickstart**](file:///D:/skills_lab/Travel_planner/backend/README.md) | Prerequisites, environment variable configuration, development server startup, and build instructions. |

---

## 📂 Source Code Structure

```
Travel_planner/
├── README.md                      # Original project brief & team roles
├── docs/                          # Comprehensive technical documentation (.md)
│   ├── README.md                  # Master documentation index
│   ├── API_CONTRACT.md            # Person 1 & 2 integration contract
│   ├── ARCHITECTURE.md            # System architecture & security model
│   ├── DATABASE_SCHEMA.md         # PostgreSQL ERD & RLS policies
│   ├── AGENT_SPEC.md              # 10-step planning loop & 10 tools
│   ├── GEMINI_SETUP.md            # Google Gemini LLM setup & model guide
│   ├── FREE_RESOURCES_GUIDE.md    # 100% Free Maps, Weather, Routing & Currency
│   ├── PERSON_1_FRONTEND_GUIDE.md # Frontend integration handbook
│   └── TESTING_GUIDE.md           # Vitest test suite guide (36 tests)
├── supabase/
│   ├── migrations/
│   │   └── 20261022000000_init_schema.sql # 9 tables, constraints, indexes & RLS
│   └── seed.sql                   # Realistic Tokyo & Paris seed data
└── backend/
    ├── .env.example               # Environment variables template
    ├── package.json               # Backend dependencies & test scripts
    ├── tsconfig.json              # TypeScript configuration
    ├── vitest.config.ts           # Vitest configuration
    ├── README.md                  # Backend developer setup guide
    ├── src/
    │   ├── config/                # Validated environment configuration
    │   ├── types/                 # Database & Domain TypeScript types
    │   ├── schemas/               # Zod request & response schemas
    │   ├── db/                    # Supabase client (scoped & admin)
    │   ├── integrations/          # Places, Weather, Routes, Currency, Lodging adapters
    │   ├── agent/                 # Agent orchestrator, 10 tools, prompts, validator
    │   ├── middleware/            # Auth, validation, rate limiting, error handling
    │   ├── services/              # Trip & AgentRun database services
    │   ├── controllers/           # REST API controllers
    │   ├── routes/                # Express router endpoints
    │   ├── app.ts                 # Express application setup
    │   └── server.ts              # Server bootstrap & startup
    └── tests/                     # 36 automated Vitest tests
```
