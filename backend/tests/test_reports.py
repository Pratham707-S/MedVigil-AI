import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.main import app
from src.modules.intake import database as intake_database


class ReportsApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_patch = patch.object(
            intake_database,
            "DEFAULT_DATABASE_PATH",
            Path(self.temp_directory.name) / "reports.db",
        )
        self.database_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.database_patch.stop()
        self.temp_directory.cleanup()

    def confirm(self, prescription_id, patient_id, medicines, source_filename):
        return self.client.post(
            f"/api/v1/prescriptions/{prescription_id}/confirm",
            json={
                "patient_id": patient_id,
                "prescribed_on": "2026-10-01" if prescription_id.endswith("old") else "2026-11-01",
                "source_filename": source_filename,
                "medicines": medicines,
            },
        )

    def test_timeline_to_preview_to_download_preserves_sources_and_flags(self):
        self.confirm(
            "rx-old",
            "demo-patient",
            [
                {"name": "Lisinopril", "dose": "10 mg", "frequency": "daily"},
                {"name": "Metformin", "dose": "500 mg", "frequency": "daily"},
            ],
            "older.pdf",
        )
        self.confirm(
            "rx-new",
            "demo-patient",
            [{"name": "Metformin", "dose": "500 mg", "frequency": "daily"}],
            "newer.pdf",
        )
        self.client.post(
            "/api/v1/intake",
            json={
                "patient_id": "demo-patient",
                "medicines": [{"name": "Vitamin D", "dose": "1000 IU", "frequency": "daily"}],
            },
        )

        preview = self.client.get("/api/v1/summary", params={"patient_id": "demo-patient"})
        body = preview.json()
        download = self.client.get("/api/v1/summary/download", params={"patient_id": "demo-patient"})

        self.assertEqual(preview.status_code, 200)
        self.assertEqual([item["source_filename"] for item in body["prescriptions"]], ["older.pdf", "newer.pdf"])
        self.assertEqual(body["intake"][0]["medicines"][0]["source"], "patient-reported")
        self.assertEqual(body["clarifications"][0]["medicine"], "Lisinopril")
        self.assertEqual(body["clarifications"][0]["reviewer_status"], "needs_clarification")
        self.assertIsNone(body["clarifications"][0]["patient_instruction"])
        self.assertEqual(download.status_code, 200)
        self.assertIn('attachment; filename="demo-patient-medication-summary.txt"', download.headers["content-disposition"])
        self.assertIn("older.pdf", download.text)
        self.assertIn("Are you still taking Lisinopril?", download.text)
        self.assertIn("Patient instruction: None (clarification only)", download.text)

    def test_empty_history_returns_preview_and_download(self):
        preview = self.client.get("/api/v1/summary", params={"patient_id": "empty-patient"})
        download = self.client.get("/api/v1/summary/download", params={"patient_id": "empty-patient"})

        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview.json()["prescriptions"], [])
        self.assertEqual(preview.json()["intake"], [])
        self.assertIn("None recorded", download.text)

    def test_other_patient_records_are_not_in_summary(self):
        self.confirm("rx-other", "other-patient", [{"name": "Private Medicine"}], "other.pdf")
        self.client.post(
            "/api/v1/intake",
            json={
                "patient_id": "other-patient",
                "medicines": [{"name": "Private OTC", "source": "patient-reported"}],
            },
        )

        body = self.client.get("/api/v1/summary", params={"patient_id": "demo-patient"}).json()

        self.assertEqual(body["prescriptions"], [])
        self.assertEqual(body["intake"], [])
        self.assertNotIn("Private Medicine", str(body))


if __name__ == "__main__":
    unittest.main()
