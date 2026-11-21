# ORBIX API contract (MVP, v0)

> Owner: Pratham. This document is the integration agreement for the modular-monolith MVP; handlers remain placeholders in the current skeleton.

## Conventions

The API base URL is `/api/v1`, except `GET /health`, which is served at the application root. Rohit owns frontend calls and presentation. Maanani owns prescription upload, extraction, and confirmation. Pratham owns intake, timeline reconciliation, summary/download, and final integration.

All dates use `YYYY-MM-DD`. IDs are opaque strings. Examples use fictional demo data only. The backend should return JSON errors using `{ "detail": "human-readable message" }` unless noted otherwise.

Medicine objects use this shape wherever possible:

```json
{
  "name": "Metformin",
  "dose": "500 mg",
  "frequency": "twice daily",
  "source": "prescription"
}
```

## `GET /health`

Purpose: Let the frontend or a deployment check confirm that the API process is reachable.

Request: No body or query parameters.

Success `200 OK`:

```json
{ "status": "ok" }
```

Errors: Infrastructure or routing failures may produce `5xx`; no patient data is involved.

Owner: Pratham for integration; Rohit may use it for a connection-state indicator.

## `POST /api/v1/prescriptions/upload`

Purpose: Upload a prescription image or PDF and create an editable extraction draft. Extraction results are not confirmed records until the user confirms them.

Request: `multipart/form-data`.

- `file`: required image or PDF upload.
- `patient_id`: optional demo patient identifier; defaults to `demo-patient` for the demo.

Success `201 Created`:

```json
{
  "prescription_id": "rx-draft-001",
  "patient_id": "demo-patient",
  "status": "draft",
  "source_filename": "demo-prescription.pdf",
  "prescribed_on": "2026-10-01",
  "medicines": [
    { "name": "Metformin", "dose": "500 mg", "frequency": "twice daily", "source": "prescription" }
  ],
  "needs_review": true
}
```

Validation and errors:

- `400 Bad Request` when `file` is missing, empty, or an unsupported type.
- `413 Payload Too Large` when the configured upload limit is exceeded.
- `422 Unprocessable Entity` when extraction cannot produce a valid draft shape; the UI should allow retry or manual review.
- Never treat extracted text as confirmed medication instructions.

Owner: Maanani for backend upload/extraction; Rohit for the upload and draft-review call flow.

## `POST /api/v1/prescriptions/{prescription_id}/confirm`

Purpose: Confirm the clinician/patient-reviewed draft as a prescription record for the timeline.

Request: JSON body.

```json
{
  "patient_id": "demo-patient",
  "prescribed_on": "2026-10-01",
  "medicines": [
    { "name": "Metformin", "dose": "500 mg", "frequency": "twice daily", "source": "prescription" }
  ]
}
```

Success `200 OK`:

```json
{
  "prescription_id": "rx-draft-001",
  "patient_id": "demo-patient",
  "status": "confirmed",
  "prescribed_on": "2026-10-01",
  "medicines": [
    { "name": "Metformin", "dose": "500 mg", "frequency": "twice daily", "source": "prescription" }
  ]
}
```

Validation and errors:

- `404 Not Found` when the draft ID does not exist.
- `409 Conflict` when the record is already confirmed or cannot be confirmed twice.
- `422 Unprocessable Entity` for a missing date, empty medicine name, or malformed medicine list.
- Confirmation must preserve the reviewed values and must not silently invent missing dose or frequency data.

Owner: Maanani for prescription confirmation; Rohit for the review/confirm call.

## `POST /api/v1/intake`

Purpose: Save medicines the patient reports currently taking, including over-the-counter products. These are patient-reported inputs, not prescriptions.

Request: JSON body.

```json
{
  "patient_id": "demo-patient",
  "medicines": [
    { "name": "Vitamin D", "dose": "1000 IU", "frequency": "daily", "source": "patient-reported" }
  ]
}
```

Success `201 Created`:

```json
{
  "intake_id": "intake-001",
  "patient_id": "demo-patient",
  "status": "saved",
  "medicines": [
    { "name": "Vitamin D", "dose": "1000 IU", "frequency": "daily", "source": "patient-reported" }
  ]
}
```

Validation and errors:

- `422 Unprocessable Entity` for a missing patient ID, empty medicine name, or non-`patient-reported` source.
- `409 Conflict` only if the MVP chooses to reject a duplicate submission; otherwise repeated submissions should remain distinguishable by intake ID.
- Do not convert patient-reported medicines into confirmed prescriptions.

Owner: Pratham for backend intake and integration; Rohit for the intake form and call.

## `GET /api/v1/timeline?patient_id=demo-patient`

Purpose: Return dated confirmed prescriptions, patient-reported intake, and reconciliation findings in chronological order.

Request: Required `patient_id` query parameter.

Success `200 OK`:

```json
{
  "patient_id": "demo-patient",
  "events": [
    {
      "type": "prescription",
      "prescription_id": "rx-older-001",
      "date": "2026-08-01",
      "medicines": [
        { "name": "Lisinopril", "dose": "10 mg", "frequency": "daily", "source": "prescription" }
      ]
    },
    {
      "type": "prescription",
      "prescription_id": "rx-newer-001",
      "date": "2026-10-01",
      "medicines": []
    }
  ],
  "clarifications": [
    {
      "medicine": "Lisinopril",
      "question": "Are you still taking Lisinopril?",
      "reviewer_status": "needs_clarification",
      "patient_instruction": null
    }
  ]
}
```

Validation and errors:

- `400 Bad Request` when `patient_id` is missing or blank.
- `404 Not Found` when the patient has no demo or stored records.
- The Missing Stop Detector flags a medicine only when it appears on an older confirmed prescription, is absent from a newer confirmed prescription, and has no explicit stop instruction.
- Its output is a clarification question for review, never an instruction to stop or continue a medicine. Keep `patient_instruction` null.

Owner: Pratham for reconciliation and integration; Rohit for timeline rendering.

## `GET /api/v1/summary?patient_id=demo-patient`

Purpose: Produce a doctor-ready summary preview from the timeline and reconciliation result.

Request: Required `patient_id` query parameter.

Success `200 OK`:

```json
{
  "patient_id": "demo-patient",
  "title": "Medication reconciliation summary",
  "current_medications": [
    { "name": "Metformin", "dose": "500 mg", "frequency": "twice daily", "source": "prescription" }
  ],
  "clarifications": [
    {
      "medicine": "Lisinopril",
      "question": "Are you still taking Lisinopril?",
      "reviewer_status": "needs_clarification",
      "patient_instruction": null
    }
  ],
  "review_note": "Resolve clarification questions with the patient before clinical decisions."
}
```

Validation and errors:

- `400 Bad Request` when `patient_id` is missing or blank.
- `404 Not Found` when no timeline exists for the patient.
- `500 Internal Server Error` if reconciliation output cannot be assembled; do not return a partial summary that hides a failure.
- Summary data must be derived from reconciliation output, including unresolved clarification flags.

Owner: Pratham for reconciliation-to-report integration; Rohit for the summary preview.

## `GET /api/v1/summary/download?patient_id=demo-patient`

Purpose: Download the same doctor-ready summary for handoff or review.

Request: Required `patient_id` query parameter. The MVP may return `text/plain`; a later version may add PDF without changing the summary semantics.

Success `200 OK`:

- `Content-Type: text/plain; charset=utf-8`
- `Content-Disposition: attachment; filename="demo-patient-medication-summary.txt"`
- Body contains the fields from `GET /summary`, including every unresolved clarification question.

Validation and errors:

- `400 Bad Request` when `patient_id` is missing or blank.
- `404 Not Found` when no summary exists for the patient.
- `500 Internal Server Error` when export fails; never emit a misleading or empty download.

Owner: Pratham for report export and integration; Rohit for the download affordance.
