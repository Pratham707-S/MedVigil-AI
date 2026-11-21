# Prescriptions backend

Owner: Maanani

This module handles prescription file upload, extraction into an editable draft, and confirmation of reviewed prescription data. Confirmed prescriptions are intended to become dated records for the patient timeline.

## Flow

1. `POST /api/v1/prescriptions/upload` accepts a JPG, PNG, or PDF file and an optional `patient_id` (defaults to `demo-patient`).
2. The router checks the file type, rejects empty files, and enforces a 10 MB limit.
3. `GeminiExtractionProvider` extracts the prescribed date and medicine details. The router returns a `PrescriptionDraft` with `needs_review=true`; extraction is not treated as confirmed medical instruction.
4. A reviewer checks and edits the draft values.
5. `POST /api/v1/prescriptions/{prescription_id}/confirm` accepts the reviewed patient ID, date, and medicines. It verifies the draft exists, the patient ID matches, and it has not already been confirmed.
6. The endpoint returns a `ConfirmedPrescription`, preserving the submitted reviewed medicine values.

## Current limitations

- Drafts and confirmed records are held in process memory. They are lost when the server restarts and are not shared between multiple workers. Add persistent repository storage before relying on these records beyond a single-process demo.
- The prescriptions router must be registered by the integration owner in `backend/src/main.py` for these endpoints to be reachable from the running API.
- The extraction provider requires its Gemini configuration to be set up; extraction can fail and should be reviewed by a person before confirmation.
