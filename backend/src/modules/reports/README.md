# Reports backend

Owner: Pratham

`GET /api/v1/summary?patient_id=...` builds a typed preview from the patient-scoped timeline. `GET /api/v1/summary/download?patient_id=...` renders that same result as deterministic `text/plain` with a safe attachment filename.

Reports consume reconciliation output for clarification flags; they do not reimplement Missing Stop Detector logic. Empty histories return valid empty summaries, and source filenames plus patient-reported intake are retained for reviewer context.
