import asyncio
import unittest
from datetime import date
from io import BytesIO

from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from src.modules.prescriptions.extraction import ExtractionDraft
from src.modules.prescriptions.router import MAX_UPLOAD_BYTES, upload_prescription


class FakeExtractionProvider:
    def __init__(self):
        self.received = None

    def extract(self, document: bytes, mime_type: str) -> ExtractionDraft:
        self.received = (document, mime_type)
        return ExtractionDraft(
            prescribed_on=date(2026, 10, 1),
            medicines=[{"name": "Metformin", "dose": "500 mg", "frequency": "daily"}],
        )


def upload(filename: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        file=BytesIO(content),
        filename=filename,
        headers=Headers({"content-type": content_type}),
    )


class PrescriptionUploadTests(unittest.TestCase):
    def test_upload_returns_editable_draft_from_fake_provider(self):
        provider = FakeExtractionProvider()
        draft = asyncio.run(
            upload_prescription(upload("demo.pdf", b"pdf-bytes", "application/pdf"), provider)
        )

        self.assertEqual(draft.medicines[0].name, "Metformin")
        self.assertEqual(provider.received, (b"pdf-bytes", "application/pdf"))

    def test_unsupported_type_is_rejected(self):
        with self.assertRaises(HTTPException) as context:
            asyncio.run(upload_prescription(upload("demo.txt", b"text", "text/plain"), FakeExtractionProvider()))

        self.assertEqual(context.exception.status_code, 415)

    def test_oversized_upload_is_rejected(self):
        with self.assertRaises(HTTPException) as context:
            asyncio.run(
                upload_prescription(
                    upload("large.pdf", b"x" * (MAX_UPLOAD_BYTES + 1), "application/pdf"),
                    FakeExtractionProvider(),
                )
            )

        self.assertEqual(context.exception.status_code, 413)


if __name__ == "__main__":
    unittest.main()
