# RAGANG dashboard maintenance guide

## Role and architecture

This repository is the source of truth for the RAGANG React dashboard. The
production build may be bundled into `ragang/web/` in the separate backend
repository, but generated bundles are never edited directly.

- `src/apis/socket.ts` owns the browser WebSocket client and topic contract.
- `src/globals/recoil/` owns shared dashboard, loading, and live-test state.
- `src/pages/Dashboard/` transforms persisted backend history into charts and
  detail views.
- `src/pages/TestQuery/` visualizes the flow and live module/evaluation events.
- `src/pages/Settings/` selects server-side query files and starts evaluation.
- `config/webpack.*.js` defines development and production builds; `dist/` is
  generated output.

The dashboard must visualize real WebSocket or persisted evaluation data. Do
not introduce mock scores into production paths.

## Local commands

- Install the dependency tree from the committed lockfile with `npm ci`.
- Run unit tests with `npm test`.
- Run static type validation with `npm run typecheck`.
- Start the development server with `npm run dev`.
- Create a production build with `npm run build`.
- Run any configured type, lint, and test scripts before installing a build in
  the backend. If a required script is missing, add the smallest appropriate
  script and keep it deterministic.

Use Node and npm versions documented by the repository. Dependency updates
must update and commit `package-lock.json` so a clean checkout can reproduce
them.

## Backend contract

- The default backend connection is loopback-only. Make the WebSocket URL
  configurable without serializing unrelated environment variables into the
  browser bundle.
- Keep topic names and payload fields aligned with `ragang/core/network/`.
  Contract changes require tests on both repositories.
- Preserve explicit not-evaluated and error states. Do not coerce missing,
  failed, or non-finite metric results to a successful numeric score.
- Keep observed metric evidence distinct from any inferred diagnosis.
- Render every repeated module snapshot and its execution index. When trace is
  available, preserve parent IDs, status, latency, revisit, and failure type.
- Never average metrics with different names, units, ranges, or directions into
  an overall score or module ranking. Do not infer percentages from numeric
  magnitude; display the backend-declared unit.
- History refresh, live execution, and page reload must resolve to real backend
  or persisted data rather than stale Recoil or service-worker state.

## Generated asset policy

- Do not commit or hand-edit `dist/` or the backend's `ragang/web/` files as
  source changes.
- A production build must be reproducible from a clean checkout and committed
  lockfile before it is installed in the backend repository.
- Install a build as a complete set: HTML, hashed JS/CSS, fonts, source maps,
  service worker, and workbox runtime. Do not retain orphaned hashed assets.
- Verify that `index.html` and the service-worker precache manifest reference
  the same emitted files.

## Contribution rules

- Work on a dedicated branch, not `master`, `feat/begin`, or another shared
  branch directly.
- Keep UI changes tied to a verified user flow or backend contract.
- Never commit credentials, complete process environments, personal paths,
  local `.env` files, `node_modules/`, or generated build output.
- Expose only explicitly allowlisted public environment variables to webpack;
  never serialize `process.env` as a whole.
- Do not push, merge, tag, deploy, or rewrite history without explicit user
  approval.
