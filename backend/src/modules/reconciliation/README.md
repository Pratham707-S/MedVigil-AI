# Reconciliation backend

Owner: Pratham

## Missing Stop Detector flow

1. Receive two confirmed prescription records: an older record and a newer record.
2. Compare medicine names after trimming whitespace and ignoring case.
3. For each medicine missing from the newer record, check the newer record's explicit stop instructions.
4. Return a clarification question only when there is no matching stop instruction.

Every result is marked `needs_clarification` and has no patient instruction. The detector never tells a patient to stop or continue a medicine. This slice is a pure service with no database, router, report, or frontend work yet.

## Fictional examples

Older prescription:

```json
{"prescription_id":"rx-old","medicines":[{"name":" Lisinopril ","dose":"10 mg","frequency":"daily"}]}
```

Newer prescription:

```json
{"prescription_id":"rx-new","medicines":[],"stop_instructions":[]}
```

Result:

```json
{
  "medicine": {"name":" Lisinopril ","dose":"10 mg","frequency":"daily"},
  "question": "Are you still taking  Lisinopril ?",
  "reviewer_status": "needs_clarification",
  "patient_instruction": null
}
```

An explicit `"stop_instructions": ["lisinopril"]` produces no flag. A newer prescription containing `"name": "lisinopril"` also produces no flag. Both cases match despite case or surrounding whitespace differences.

The output is clarification only for a reviewer. It must never advise the patient to stop or continue a medicine.

## Tests

From `backend/`, run the focused detector tests:

```bash
.venv/bin/python -m unittest discover tests -p 'test_reconciliation.py' -v
```

Run the full backend suite with:

```bash
.venv/bin/python -m unittest discover tests -v
```
