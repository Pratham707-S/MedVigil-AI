# Team ownership and boundaries

| Area | Owner | Starting location |
| --- | --- | --- |
| React UI and mobile-first flows | Rohit | `frontend/src/features` |
| Prescription upload, extraction, and confirmed records | Maanani | `backend/src/modules/prescriptions` |
| API contract | User | `docs/api-contract.md` |
| Patient-reported intake | User | `backend/src/modules/intake` |
| Timeline reconciliation and Missing Stop Detector | User | `backend/src/modules/reconciliation` |
| Summary preview and export | User | `backend/src/modules/reports` |
| Final integration | User | `backend/src`, `frontend/src` |

The Missing Stop Detector must ask whether a medicine is still being taken, mark the item `Needs clarification` for the reviewer, and never instruct a patient to stop or continue a medicine.
