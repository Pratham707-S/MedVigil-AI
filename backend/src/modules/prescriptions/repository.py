import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from src.modules.intake.database import connect

from .schemas import ConfirmPrescriptionRequest, ConfirmedPrescription


class DuplicatePrescriptionError(RuntimeError):
    """Raised when a prescription ID has already been confirmed."""


class PrescriptionRepository:
    def __init__(self, database_path: str | Path | None = None) -> None:
        self.database_path = database_path

    def _ensure_table(self, connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS confirmed_prescriptions (
                prescription_id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                prescribed_on TEXT NOT NULL,
                source_filename TEXT NOT NULL,
                medicines_json TEXT NOT NULL,
                stop_instructions_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        columns = {row[1] for row in connection.execute("PRAGMA table_info(confirmed_prescriptions)")}
        if "stop_instructions_json" not in columns:
            connection.execute(
                "ALTER TABLE confirmed_prescriptions ADD COLUMN stop_instructions_json TEXT NOT NULL DEFAULT '[]'"
            )

    def save_confirmed(
        self,
        prescription_id: str,
        payload: ConfirmPrescriptionRequest,
    ) -> ConfirmedPrescription:
        """Save the confirmed prescription and medicines in one transaction."""
        connection = connect(self.database_path)
        try:
            self._ensure_table(connection)
            connection.commit()
            connection.execute("BEGIN")
            connection.execute(
                """
                INSERT INTO confirmed_prescriptions
                    (prescription_id, patient_id, prescribed_on, source_filename, medicines_json, stop_instructions_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    prescription_id,
                    payload.patient_id,
                    payload.prescribed_on.isoformat(),
                    payload.source_filename,
                    json.dumps([medicine.model_dump() for medicine in payload.medicines]),
                    json.dumps(payload.stop_instructions),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            connection.commit()
        except sqlite3.IntegrityError as error:
            connection.rollback()
            raise DuplicatePrescriptionError(prescription_id) from error
        finally:
            connection.close()

        return ConfirmedPrescription(
            prescription_id=prescription_id,
            patient_id=payload.patient_id,
            prescribed_on=payload.prescribed_on,
            medicines=payload.medicines,
            source_filename=payload.source_filename,
            stop_instructions=payload.stop_instructions,
        )

    def get_confirmed(self, prescription_id: str) -> ConfirmedPrescription | None:
        """Read a confirmed prescription for reconciliation consumers."""
        connection = connect(self.database_path)
        try:
            self._ensure_table(connection)
            row = connection.execute(
                """
                SELECT prescription_id, patient_id, prescribed_on, source_filename, medicines_json, stop_instructions_json
                FROM confirmed_prescriptions WHERE prescription_id = ?
                """,
                (prescription_id,),
            ).fetchone()
        finally:
            connection.close()

        if row is None:
            return None
        return ConfirmedPrescription(
            prescription_id=row["prescription_id"],
            patient_id=row["patient_id"],
            prescribed_on=row["prescribed_on"],
            medicines=json.loads(row["medicines_json"]),
            source_filename=row["source_filename"],
            stop_instructions=json.loads(row["stop_instructions_json"]),
        )

    def list_confirmed(self, patient_id: str) -> list[ConfirmedPrescription]:
        """Read this patient's confirmed records in deterministic date order."""
        connection = connect(self.database_path)
        try:
            self._ensure_table(connection)
            rows = connection.execute(
                """
                SELECT prescription_id FROM confirmed_prescriptions
                WHERE patient_id = ? ORDER BY prescribed_on ASC, prescription_id ASC
                """,
                (patient_id,),
            ).fetchall()
        finally:
            connection.close()

        records = []
        for row in rows:
            record = self.get_confirmed(row["prescription_id"])
            if record is not None:
                records.append(record)
        return records
