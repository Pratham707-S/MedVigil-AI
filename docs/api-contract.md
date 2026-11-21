# ORBIX API contract draft (v0)

Base URL: `/api/v1`

All dates are ISO-8601 dates. IDs are opaque strings. Demo data is fictional.

The routes below are planned integration seams. They are not implemented in this skeleton.

## `POST /prescriptions`

Multipart upload with `file` and optional `patient_id`. Returns a draft extraction:

```json
{
  "id": "rx-draft-001",
  "status": "draft",
  "source_filename": "demo-prescription.pdf",
  "prescribed_on": "2026-10-01",
  "medicines": [{"name": "Metformin", "dose": "500 mg", "frequency": "twice daily"}],
  "needs_review": true
}
```

## `POST /prescriptions/{id}/confirm`

Accepts `{ "medicines": [...], "prescribed_on": "YYYY-MM-DD" }` and persists a confirmed prescription.

## `POST /intake`

Accepts `{ "patient_id": "demo-patient", "medicines": [{"name":"...","dose":"...","frequency":"...","source":"patient-reported"}] }`.

## `GET /timeline/{patient_id}`

Returns confirmed prescriptions, patient-reported medicines, and reconciliation flags. A missing-stop flag contains `question`, `reviewer_status: "needs_clarification"`, and `patient_instruction: null`.

## `GET /reports/{patient_id}`

Returns a doctor-ready summary assembled from the reconciliation result, including unresolved clarification flags.

## `GET /reports/{patient_id}/download`

Returns the same summary as a downloadable `text/plain` file in this demo.
