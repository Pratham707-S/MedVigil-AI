import io
import unittest
from datetime import date
from unittest.mock import patch

from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from src.modules.prescriptions import router as prescriptions_router
from src.modules.prescriptions.extraction import ExtractionDraft, ExtractedMedicine
from src.modules.prescriptions.gemini_provider import GeminiConfigurationError
from src.modules.prescriptions.schemas import ConfirmPrescriptionRequest


def upload_file(
    content: bytes = b"prescription image",
    content_type: str = "image/png",
    filename: str = "prescription.png",
) -> UploadFile:
    return UploadFile(
        file=io.BytesIO(content),
        filename=filename,
        headers=Headers({"content-type": content_type}),
    )


class FakeExtractionProvider:
    def __init__(self, result=None, error=None):
        self.result = result or ExtractionDraft(
            prescribed_on=date(2026, 10, 1),
            medicines=[
                ExtractedMedicine(
                    name="Metformin",
                    dose="500 mg",
                    frequency="twice daily",
                )
            ],
        )
        self.error = error

    def extract(self, document: bytes, mime_type: str) -> ExtractionDraft:
        if self.error:
            raise self.error
        return self.result


class PrescriptionRouterTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        prescriptions_router._drafts.clear()
        prescriptions_router._confirmed.clear()

    async def test_upload_creates_reviewable_draft_from_supported_file(self):
        with patch.object(
            prescriptions_router,
            "GeminiExtractionProvider",
            return_value=FakeExtractionProvider(),
        ):
            draft = await prescriptions_router.upload_prescription(
                upload_file(), patient_id=" patient-123 "
            )

        self.assertEqual(draft.patient_id, "patient-123")
        self.assertEqual(draft.source_filename, "prescription.png")
        self.assertEqual(draft.prescribed_on, date(2026, 10, 1))
        self.assertEqual(draft.medicines[0].name, "Metformin")
        self.assertTrue(draft.needs_review)
        self.assertIn(draft.prescription_id, prescriptions_router._drafts)

    async def test_upload_rejects_unsupported_file_type(self):
        with self.assertRaises(HTTPException) as raised:
            await prescriptions_router.upload_prescription(
                upload_file(content_type="text/plain"), patient_id="patient-123"
            )

        self.assertEqual(raised.exception.status_code, 400)

    async def test_upload_rejects_empty_file(self):
        with self.assertRaises(HTTPException) as raised:
            await prescriptions_router.upload_prescription(
                upload_file(content=b""), patient_id="patient-123"
            )

        self.assertEqual(raised.exception.status_code, 400)

    async def test_upload_rejects_file_over_10_mb(self):
        oversized_content = b"x" * (prescriptions_router.MAX_FILE_SIZE + 1)
        with self.assertRaises(HTTPException) as raised:
            await prescriptions_router.upload_prescription(
                upload_file(content=oversized_content), patient_id="patient-123"
            )

        self.assertEqual(raised.exception.status_code, 413)

    async def test_upload_rejects_blank_patient_id(self):
        with self.assertRaises(HTTPException) as raised:
            await prescriptions_router.upload_prescription(
                upload_file(), patient_id="  "
            )

        self.assertEqual(raised.exception.status_code, 422)

    async def test_upload_maps_missing_gemini_configuration_to_503(self):
        with patch.object(
            prescriptions_router,
            "GeminiExtractionProvider",
            return_value=FakeExtractionProvider(
                error=GeminiConfigurationError("missing key")
            ),
        ):
            with self.assertRaises(HTTPException) as raised:
                await prescriptions_router.upload_prescription(
                    upload_file(), patient_id="patient-123"
                )

        self.assertEqual(raised.exception.status_code, 503)

    async def test_upload_rejects_extraction_without_readable_medicine_names(self):
        no_medicines = ExtractionDraft(
            prescribed_on=date(2026, 10, 1),
            medicines=[ExtractedMedicine(name="", dose="500 mg")],
        )
        with patch.object(
            prescriptions_router,
            "GeminiExtractionProvider",
            return_value=FakeExtractionProvider(result=no_medicines),
        ):
            with self.assertRaises(HTTPException) as raised:
                await prescriptions_router.upload_prescription(
                    upload_file(), patient_id="patient-123"
                )

        self.assertEqual(raised.exception.status_code, 422)

    def make_draft(self, patient_id="patient-123"):
        draft = prescriptions_router.PrescriptionDraft(
            prescription_id="draft-123",
            patient_id=patient_id,
            source_filename="prescription.pdf",
            prescribed_on=date(2026, 10, 1),
            medicines=[prescriptions_router.PrescriptionMedicine(name="Metformin")],
        )
        prescriptions_router._drafts[draft.prescription_id] = draft
        return draft

    def make_confirmation_request(self, patient_id="patient-123"):
        return ConfirmPrescriptionRequest(
            patient_id=patient_id,
            prescribed_on=date(2026, 10, 2),
            medicines=[
                {"name": "Metformin", "dose": "500 mg", "frequency": "daily"}
            ],
        )

    def test_confirm_returns_reviewed_values_and_consumes_draft(self):
        self.make_draft()

        confirmed = prescriptions_router.confirm_prescription(
            "draft-123", self.make_confirmation_request()
        )

        self.assertEqual(confirmed.status, "confirmed")
        self.assertEqual(confirmed.prescribed_on, date(2026, 10, 2))
        self.assertEqual(confirmed.medicines[0].dose, "500 mg")
        self.assertNotIn("draft-123", prescriptions_router._drafts)
        self.assertIn("draft-123", prescriptions_router._confirmed)

    def test_confirm_returns_404_for_unknown_draft(self):
        with self.assertRaises(HTTPException) as raised:
            prescriptions_router.confirm_prescription(
                "missing", self.make_confirmation_request()
            )

        self.assertEqual(raised.exception.status_code, 404)

    def test_confirm_rejects_patient_mismatch(self):
        self.make_draft()

        with self.assertRaises(HTTPException) as raised:
            prescriptions_router.confirm_prescription(
                "draft-123", self.make_confirmation_request("another-patient")
            )

        self.assertEqual(raised.exception.status_code, 422)
        self.assertIn("draft-123", prescriptions_router._drafts)

    def test_confirm_rejects_duplicate_confirmation(self):
        self.make_draft()
        prescriptions_router.confirm_prescription(
            "draft-123", self.make_confirmation_request()
        )

        with self.assertRaises(HTTPException) as raised:
            prescriptions_router.confirm_prescription(
                "draft-123", self.make_confirmation_request()
            )

        self.assertEqual(raised.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
