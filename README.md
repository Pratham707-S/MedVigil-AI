# MedVigil AI / ORBIX team skeleton

Clean starting point for the hackathon project. The repository intentionally contains scaffolding only; feature implementation is owned by the teammates below.

## Ownership boundaries

- Rohit: React UI in `frontend/src/features` (upload, draft review, intake, timeline, reports).
- Maanani: prescription backend in `backend/src/modules/prescriptions`.
- User: API contract, intake backend, reconciliation/Missing Stop Detector, report export, and final integration.

## Planned architecture

One React frontend and one Python + FastAPI modular-monolith backend. SQLite is the planned demo persistence layer. HTTP belongs in routers, validation in schemas, and business rules in services.

## Start here

- [`docs/api-contract.md`](docs/api-contract.md): contract draft and integration seams.
- [`docs/team-ownership.md`](docs/team-ownership.md): implementation boundaries.
- [`frontend`](frontend): minimal React package scaffold for Rohit.
- [`backend`](backend): minimal FastAPI package scaffold for Maanani and the integration owners.
- [`fixtures/demo`](fixtures/demo): fictional demo-data placeholder; no real patient data or secrets.

No OCR, database behavior, Missing Stop Detector, report generation, or production UI is implemented in this skeleton.
