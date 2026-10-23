# TripPilot AI agent playbooks

This folder contains role-specific `AGENTS.md` instructions for working on TripPilot AI.
Each role lives in its own directory so the standard `AGENTS.md` filename can be used
without making the role documents ambiguous.

## Available roles

| Role | Use this when you are... |
|---|---|
| [Software engineer](./software-engineer/AGENTS.md) | Defining architecture, integration boundaries, security, or delivery scope. |
| [Developer](./developer/AGENTS.md) | Implementing or changing frontend, backend, database, or API behavior. |
| [UI designer](./ui-designer/AGENTS.md) | Designing or implementing user-facing layouts, interaction states, and accessibility. |

Read [`./AGENTS.md`](./AGENTS.md) first for rules shared by every role, then read the
role playbook that matches the work.

## Project verification flow

From the repository root, use the existing project checks rather than creating a
second test runner:

```bash
npm test
npm --prefix backend exec -- tsx backend/tests/verify-queries.ts
npm run build:all
```

`npm test` runs the backend Vitest suites, `verify-queries.ts` checks the five
destination/query flows plus invalid input handling, and `build:all` type-checks and
builds both services. If the change affects a visible browser interaction, also run
the frontend and backend locally and perform the smoke steps described in the role
playbooks.
