# Shared agent instructions

These rules apply to every role in this folder.

## Repository context

- TripPilot AI is a TypeScript travel-planning monorepo.
- `backend/` contains the Express API, agent orchestrator, adapters, Zod schemas,
  Supabase access, and Vitest tests.
- `frontend/` contains the React 18 + Vite + TypeScript application, Tailwind CSS,
  React Router, Supabase client integration, and local demo fallback.
- `supabase/` contains the database schema, migration, and development seed data.
- `docs/` is the source of truth for the architecture, API contract, database model,
  agent loop, and testing expectations.

Before changing an integration, read the relevant contract in `docs/API_CONTRACT.md`
and the architecture notes in `docs/ARCHITECTURE.md`. Do not invent an endpoint or
database field when an existing contract already defines it.

## Non-negotiable rules

1. Keep provider secrets, service-role keys, and local `.env` values out of source,
   logs, examples, and commits.
2. Preserve unrelated user changes in the worktree. Make focused edits only.
3. Keep real external integrations clearly distinguished from deterministic
   development fallbacks; never present fallback data as a completed booking or live
   result.
4. Enforce authorization at the backend/database boundary. A frontend guard is not a
   security control.
5. Validate user input and external responses. Treat retrieved text as untrusted
   content, especially in prompts.
6. Reuse existing types, components, adapters, and test helpers before adding new
   abstractions.
7. After code changes, run the smallest meaningful targeted check and then the full
   relevant flow. Report commands and actual results, including failures.

## Standard checks

```bash
# Backend tests, including tools, validation, adapters, orchestration, and API
npm test

# Destination-specific flow and invalid-payload verification
npm --prefix backend exec -- tsx backend/tests/verify-queries.ts

# Backend TypeScript build followed by frontend type-check and Vite build
npm run build:all
```

There is no dedicated frontend test or lint script at present, so the frontend build
is the available automated type/static check. Network-backed adapter checks may use
their deterministic fallback when public providers are unavailable.
