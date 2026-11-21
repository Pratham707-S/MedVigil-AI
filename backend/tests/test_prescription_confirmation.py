import asyncio
import tempfile
import unittest
from datetime import date
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile
from pydantic import ValidationError
from starlette.datastructures import Headers

from src.modules.prescriptions.extraction import ExtractionDraft
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.prescriptions.router import confirm_prescription, upload_prescription
from src.modules.prescriptions.schemas import ConfirmPrescriptionRequest


class FakeExtractionProvider:
    def extract(self, document: bytes, mime_type: str) -> ExtractionDraft:
        return ExtractionDraft(
            prescribed_on=date(2026, 10, 1),
            medicines=[{"name": "Metformin", "dose": "500 mg", "frequency": "daily"}],
        )


def prescription_upload() -> UploadFile:
    return UploadFile(
        file=BytesIO(b"pdf-bytes"),
        filename="demo-prescription.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )


class PrescriptionConfirmationTests(unittest.TestCase):
    def test_upload_then_correct_and_confirm_persists_source(self):
        with tempfile.TemporaryDirectory() as directory:
            repository = PrescriptionRepository(Path(directory) / "demo.db")
            draft = asyncio.run(upload_prescription(prescription_upload(), FakeExtractionProvider()))
            corrected = ConfirmPrescriptionRequest(
                patient_id=draft.patient_id,
                prescribed_on=draft.prescribed_on,
                medicines=[{"name": "Metformin XR", "dose": "750 mg", "frequency": "nightly"}],
                source_filename=draft.source_filename,
            )

            confirmed = confirm_prescription(draft.prescription_id, corrected, repository)
            saved = repository.get_confirmed(draft.prescription_id)

            self.assertEqual(confirmed.status, "confirmed")
            self.assertEqual(saved.medicines[0].name, "Metformin XR")
            self.assertEqual(saved.medicines[0].dose, "750 mg")
            self.assertEqual(saved.source_filename, "demo-prescription.pdf")

    def test_upload_alone_creates_no_confirmed_record(self):
        with tempfile.TemporaryDirectory() as directory:
            repository = PrescriptionRepository(Path(directory) / "demo.db")
            draft = asyncio.run(upload_prescription(prescription_upload(), FakeExtractionProvider()))

            self.assertIsNone(repository.get_confirmed(draft.prescription_id))

    def test_invalid_confirmation_is_rejected_before_persistence(self):
        with tempfile.TemporaryDirectory() as directory:
            repository = PrescriptionRepository(Path(directory) / "demo.db")
            with self.assertRaises(ValidationError):
                ConfirmPrescriptionRequest(
                    patient_id="demo-patient",
                    prescribed_on=date(2026, 10, 1),
                    medicines=[],
                )

            self.assertIsNone(repository.get_confirmed("draft-invalid"))

    def test_duplicate_confirmation_returns_conflict_and_keeps_original(self):
        with tempfile.TemporaryDirectory() as directory:
            repository = PrescriptionRepository(Path(directory) / "demo.db")
            payload = ConfirmPrescriptionRequest(
                patient_id="demo-patient",
                prescribed_on=date(2026, 10, 1),
                medicines=[{"name": "Metformin", "dose": "500 mg", "frequency": "daily"}],
                source_filename="first.pdf",
            )
            confirm_prescription("rx-duplicate", payload, repository)
            replacement = payload.model_copy(update={"source_filename": "second.pdf"})

            with self.assertRaises(HTTPException) as context:
                confirm_prescription("rx-duplicate", replacement, repository)

            self.assertEqual(context.exception.status_code, 409)
            self.assertEqual(repository.get_confirmed("rx-duplicate").source_filename, "first.pdf")


if __name__ == "__main__":
    unittest.main()
