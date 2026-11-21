import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.main import app
from src.modules.intake import database as intake_database


class TimelineApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.database_patch = patch.object(
            intake_database,
            "DEFAULT_DATABASE_PATH",
            Path(self.temp_directory.name) / "timeline.db",
        )
        self.database_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.database_patch.stop()
        self.temp_directory.cleanup()

    def confirm(self, prescription_id, patient_id, medicines, source_filename, stop_instructions=None):
        return self.client.post(
            f"/api/v1/prescriptions/{prescription_id}/confirm",
            json={
                "patient_id": patient_id,
                "prescribed_on": "2026-10-01" if prescription_id.endswith("old") else "2026-11-01",
                "source_filename": source_filename,
                "medicines": medicines,
                "stop_instructions": stop_instructions or [],
            },
        )

    def test_two_confirmations_and_intake_return_timeline_and_flag(self):
        old = self.confirm(
            "rx-old",
            "demo-patient",
            [
                {"name": "Lisinopril", "dose": "10 mg", "frequency": "daily"},
                {"name": "Metformin", "dose": "500 mg", "frequency": "daily"},
            ],
            "older.pdf",
        )
        new = self.confirm(
            "rx-new",
            "demo-patient",
            [{"name": "Metformin", "dose": "500 mg", "frequency": "daily"}],
            "newer.pdf",
        )
        intake = self.client.post(
            "/api/v1/intake",
            json={
                "patient_id": "demo-patient",
                "medicines": [{"name": "Vitamin D", "dose": "1000 IU", "frequency": "daily"}],
            },
        )

        self.assertEqual(old.status_code, 200)
        self.assertEqual(new.status_code, 200)
        self.assertEqual(intake.status_code, 201)
        response = self.client.get("/api/v1/timeline", params={"patient_id": "demo-patient"})
        body = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["prescription_id"] for item in body["prescriptions"]], ["rx-old", "rx-new"])
        self.assertEqual(body["prescriptions"][0]["source_filename"], "older.pdf")
        self.assertEqual(body["intake"][0]["medicines"][0]["name"], "Vitamin D")
        self.assertEqual(body["clarifications"][0]["medicine"]["name"], "Lisinopril")
        self.assertEqual(body["clarifications"][0]["reviewer_status"], "needs_clarification")
        self.assertIsNone(body["clarifications"][0]["patient_instruction"])

    def test_explicit_stop_instruction_suppresses_flag(self):
        self.confirm("rx-old", "demo-patient", [{"name": "Lisinopril"}], "older.pdf")
        self.confirm(
            "rx-new",
            "demo-patient",
            [{"name": "Metformin", "dose": "500 mg", "frequency": "daily"}],
            "newer.pdf",
            stop_instructions=["Lisinopril"],
        )

        body = self.client.get("/api/v1/timeline", params={"patient_id": "demo-patient"}).json()
        self.assertEqual(body["clarifications"], [])

    def test_empty_history_returns_valid_response(self):
        response = self.client.get("/api/v1/timeline", params={"patient_id": "empty-patient"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "patient_id": "empty-patient",
            "prescriptions": [],
            "intake": [],
            "clarifications": [],
        })

    def test_other_patient_records_are_excluded(self):
        self.confirm("rx-other", "other-patient", [{"name": "Secret Medicine"}], "other.pdf")
        self.client.post(
            "/api/v1/intake",
            json={
                "patient_id": "other-patient",
                "medicines": [{"name": "Other OTC", "source": "patient-reported"}],
            },
        )

        body = self.client.get("/api/v1/timeline", params={"patient_id": "demo-patient"}).json()
        self.assertEqual(body["prescriptions"], [])
        self.assertEqual(body["intake"], [])


if __name__ == "__main__":
    unittest.main()
