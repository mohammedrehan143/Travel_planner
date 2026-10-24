# TripPilot AI agent playbooks

This folder contains role-specific `AGENTS.md` instructions for working on TripPilot AI.
Each role lives in its own directory so the standard `AGENTS.md` filename can be used
without making the role documents ambiguous.

## Available roles

| Role | Playbook / Guide | Use this when you are... |
|---|---|---|
| **Master Orchestrator** | [`./orchestrator.md`](./orchestrator.md) | Coordinating the entire multi-agent flow, quality gates, and deployment. |
| **Software Engineer** | [`./software-engineer/AGENTS.md`](./software-engineer/AGENTS.md) | Defining architecture, integration boundaries, security, or delivery scope. |
| **UI Designer** | [`./ui-designer/AGENTS.md`](./ui-designer/AGENTS.md) | Designing or implementing user-facing layouts, interaction states, and accessibility. |
| **Developer** | [`./developer/AGENTS.md`](./developer/AGENTS.md) | Implementing or changing frontend, backend, database, or API behavior. |
| **Bug Orchestrator** | [`./bugfixer/bug_ores.md`](./bugfixer/bug_ores.md) | Orchestrating bug triage: Finder → Fixer → Tester pipeline. |
| **Bug Finder** | [`./bugfixer/bug_finder.md`](./bugfixer/bug_finder.md) | Investigating UI/runtime issues and isolating root causes. |
| **Bug Fixer** | [`./bugfixer/bug_fixer.md`](./bugfixer/bug_fixer.md) | Implementing minimal, surgical fixes for verified root causes. |
| **Bug Tester** | [`./bugfixer/bug_tester.md`](./bugfixer/bug_tester.md) | Validating fixes against tests and guarding against regressions. |
| **Chatbot Fine-Tuner** | [`./chat_bot.md`](./chat_bot.md) | Fine-tuning conversational prompts, calibrating intent classification, and testing chatbot responses. |
| **Git Deployment** | [`./deployment.md`](./deployment.md) | Staging and pushing approved, tested code changes to remote Git. |

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
