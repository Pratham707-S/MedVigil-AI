import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from .database import connect
from .schemas import IntakeRequest, IntakeResponse


class IntakeRepository:
    def __init__(self, database_path: str | Path | None = None) -> None:
        """Create a repository using the default or supplied SQLite path."""
        self.database_path: str | Path | None = database_path

    def save(self, payload: IntakeRequest) -> IntakeResponse:
        """Save one intake record and return its generated response."""
        intake_id = f"intake-{uuid4().hex[:8]}"
        medicines_json = json.dumps([medicine.model_dump() for medicine in payload.medicines])
        created_at = datetime.now(timezone.utc).isoformat()

        connection = connect(self.database_path)
        try:
            connection.execute(
                "INSERT INTO intake_records (intake_id, patient_id, medicines_json, created_at) VALUES (?, ?, ?, ?)",
                (intake_id, payload.patient_id, medicines_json, created_at),
            )
            connection.commit()
        finally:
            connection.close()

        return IntakeResponse(intake_id=intake_id, patient_id=payload.patient_id, medicines=payload.medicines)

    def get(self, intake_id: str) -> IntakeResponse | None:
        """Read one intake record, or return None when it does not exist."""
        connection = connect(self.database_path)
        try:
            row = connection.execute(
                "SELECT intake_id, patient_id, medicines_json FROM intake_records WHERE intake_id = ?",
                (intake_id,),
            ).fetchone()
        finally:
            connection.close()

        if row is None:
            return None
        return IntakeResponse(
            intake_id=row["intake_id"],
            patient_id=row["patient_id"],
            medicines=json.loads(row["medicines_json"]),
        )

    def list_for_patient(self, patient_id: str) -> list[IntakeResponse]:
        """Read only this patient's reported medicines in insertion order."""
        connection = connect(self.database_path)
        try:
            rows = connection.execute(
                "SELECT intake_id FROM intake_records WHERE patient_id = ? ORDER BY created_at ASC, intake_id ASC",
                (patient_id,),
            ).fetchall()
        finally:
            connection.close()

        records = []
        for row in rows:
            record = self.get(row["intake_id"])
            if record is not None:
                records.append(record)
        return records
