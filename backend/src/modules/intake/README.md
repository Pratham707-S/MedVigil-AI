# Intake backend

Owner: Pratham

This module validates and persists `POST /api/v1/intake` requests. The repository also has a small read method so persistence can be tested independently of future read endpoints.

## Flow

1. `database.py` opens the SQLite file and creates the `intake_records` table if needed.
2. `schemas.py` validates the request and response shapes.
3. The router calls the service; it does not contain database code.
4. `service.py` delegates saving and reading to `IntakeRepository`.
5. `repository.py` serializes the medicine list into one SQLite field and returns a typed response.

The default database is `backend/medvigil.db` and can be overridden with `MEDVIGIL_DB_PATH`. Persistence is limited to intake; reconciliation and reports are separate follow-up modules.
