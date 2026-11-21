# Reconciliation backend

Owner: Pratham

## Missing Stop Detector flow

1. Receive two confirmed prescription records: an older record and a newer record.
2. Compare medicine names case-insensitively.
3. For each medicine missing from the newer record, check the newer record's explicit stop instructions.
4. Return a clarification question only when there is no matching stop instruction.

Every result is marked `needs_clarification` and has no patient instruction. The detector never tells a patient to stop or continue a medicine. This slice is a pure service with no database, router, report, or frontend work yet.
