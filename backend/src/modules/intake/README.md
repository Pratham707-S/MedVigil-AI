# Intake backend

Owner: Pratham

This module validates and persists `POST /api/v1/intake` requests. The repository also has a small read method so persistence can be tested independently of future read endpoints.

## Endpoint

`POST /api/v1/intake` records medicines and over-the-counter products that a patient reports taking.

Example request:

```json
{
  "patient_id": "demo-patient",
  "medicines": [
    {
      "name": "Vitamin D",
      "dose": "1000 IU",
      "frequency": "daily",
      "source": "patient-reported"
    }
  ]
}
```

The `201 Created` response returns a generated `intake_id`, the patient ID, `status: "saved"`, and the validated medicine list. It confirms that the report was stored; it does not turn the entry into a prescription or provide medical advice.

## Flow

1. `database.py` opens the SQLite file and creates the `intake_records` table if needed.
2. `schemas.py` validates the request and response shapes.
3. The router calls the service; it does not contain database code.
4. `service.py` delegates saving and reading to `IntakeRepository`.
5. `repository.py` serializes the medicine list into one SQLite field and returns a typed response.

The default database is `backend/medvigil.db` and can be overridden with `MEDVIGIL_DB_PATH`. Persistence is limited to intake; reconciliation and reports are separate follow-up modules.

## Focused test

From `backend/`, run:

```bash
.venv/bin/python -m unittest discover tests -p 'test_intake.py' -v
```

This is demo persistence for the hackathon. It is not production hardening: authentication, authorization, migrations, backups, concurrency strategy, and operational monitoring are still future work.
