# ADR 0001 — Stack, structure, and client-only boundary

Status: accepted (R0)

## Context

We are implementing the DIY Smart Telescope Design Explorer per spec v0.7–v0.9. The
architecture spec (v0.6) calls for a client-first, offline-capable browser app with a pure,
deterministic calculation engine that is reusable outside the browser.

## Decision

- **TypeScript (strict)** end to end. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
  are on so that `null` (unknown) is never confused with `undefined`/omitted, and array access is
  guarded — both matter for the engineering-estimator domain.
- **pnpm workspaces monorepo**, packages split along the dependency direction of v0.9 §21:
  `schema → units → validation → domain → engine-core → app-state → UI`.
- **React + Vite** for the R1 web app. App-owned CSS; custom SVG for the two R1 visuals (framing,
  pixel grid). No component/charting framework yet.
- **IndexedDB** for local-first persistence; JSON import/export is the durable backup. **No backend.**
- **Vitest** for unit/invariant/fixture tests; **Playwright** for the single R1 browser flow.
- Circular dependencies between packages are a CI failure (`dpdm`).

## Consequences

- The engine (`packages/*` except `ui-components`/`charts`) must never import React or touch the DOM.
- Results are derived and cached, never authoritative inputs.
- A future backend (short links, sync, shared catalogs) can be added without changing the engine.
