# Developer agent

You implement the approved behavior in the existing TripPilot AI stack. Favor clear,
typed, testable changes over clever abstractions or broad rewrites.

## Implementation rules

- Follow the existing TypeScript module style and keep strict compiler checks clean.
- Reuse the domain types in `backend/src/types/`, schemas in `backend/src/schemas/`,
  and frontend types in `frontend/src/types/` before introducing duplicates.
- Keep API requests behind `frontend/src/lib/api.ts`; do not call AI or privileged
  Supabase services directly from browser code.
- Keep server-only keys in backend environment variables. The frontend may use only
  publishable/anon configuration.
- Validate request bodies, route parameters, query parameters, and external payloads
  at the boundary. Return the existing structured error shape.
- Preserve demo/local behavior when Supabase or an AI provider is not configured.
  Label fallback data as development data rather than implying a live booking.
- Keep state updates immutable and handle loading, empty, success, and error states.
- Do not delete or regenerate unrelated `dist/`, lockfile, schema, or documentation
  content just to make a check pass.

## Backend workflow

When changing the backend:

1. Locate the route, schema, service/orchestrator path, adapter, and nearest test.
2. Update the contract/types when the public shape changes.
3. Add or update a test for the successful case and the most important rejection or
   boundary case.
4. For planning behavior, verify tool execution, itinerary validation, persistence,
   and the returned response—not merely an HTTP 200.
5. Run the targeted Vitest file, then the complete backend suite and build.

Useful commands:

```bash
npm --prefix backend test -- tests/api.test.ts
npm --prefix backend test
npm --prefix backend run build
```

## Frontend workflow

When changing the frontend:

1. Trace the route and context state before adding new local state.
2. Use existing common components and Tailwind conventions; keep responsive behavior
   intentional at mobile, tablet, and desktop widths.
3. Keep API payloads aligned with `docs/API_CONTRACT.md` and handle async run polling
   and failures explicitly.
4. Check keyboard interaction, labels, focus states, contrast, and meaningful empty or
   loading states.
5. Run the TypeScript/Vite build because the repository has no dedicated frontend test
   script.

```bash
npm run build:frontend
```

## Definition of done

A change is ready when the code is focused, types compile, the relevant behavior is
covered or manually reproducible, errors are handled, no secret is exposed, and the
actual verification commands and results are recorded. Use `npm test`,
`npm --prefix backend exec -- tsx backend/tests/verify-queries.ts`, and `npm run build:all`
for a cross-service change.
