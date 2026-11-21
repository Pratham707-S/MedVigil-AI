# MedVigil AI production roadmap

The repository is a working hackathon MVP. This roadmap keeps the medical-safety
boundary explicit while moving the system toward a deployable product.

## Phase 1 — MVP completion

- Finish the live React integration against the existing FastAPI response shapes.
- Keep `VITE_DEMO_MODE=true` as an explicit offline rehearsal mode only.
- Run the fictional two-prescription flow: upload, edit, confirm, add one OTC,
  inspect the Missing Stop clarification, and download the doctor summary.
- Run one live Gemini smoke with a fictional prescription asset and confirm that
  the API key remains server-side.
- Manually close superseded PR #1; do not merge its in-memory implementation.

## Phase 2 — Production backend, data, and security

- Replace SQLite repositories with a Postgres implementation using the checked-in
  migrations in `backend/migrations/`; use pooled Neon traffic URLs at runtime and
  direct URLs for migrations.
- Persist drafts, confirmed reviewed values, source references, and append-only
  confirmation audit events.
- Add authentication and patient-scoped authorization before exposing patient IDs
  to clients. Keep authorization in the API layer, not the browser.
- Store uploaded prescription files in private object storage with content-type,
  size, malware, retention, and signed-download controls.
- Add Gemini timeouts, retry/backoff policy, structured provider errors, request
  limits, and redacted observability.
- Add database migration CI, contract tests, security tests, and dependency scans.

## Phase 3 — Production frontend

- Replace demo-only patient identity with an authenticated session.
- Add real loading, retry, offline, and authorization states to every screen.
- Add accessible localization infrastructure for English, Hindi, and Marathi; the
  current selector is a UI seam, not a completed translation system.
- Add browser/mobile viewport E2E coverage for review-before-confirmation and the
  clarification-only safety wording.

## Phase 4 — Deployment and operations

- Deploy the API and SPA with explicit environment separation and secret stores.
- Add structured logs, traces, health/readiness checks, alerting, backups, restore
  drills, and privacy/data-retention controls.
- Add rate limiting, abuse protection, incident response, and a clinical safety
  review process for model/provider changes.

## Current production-foundation slice

This branch centralizes configuration, adds explicit CORS and production startup
validation, and introduces a Postgres/Neon schema plus a direct-connection
migration runner. It intentionally does not claim that the SQLite repositories or
authentication are production-ready yet.
