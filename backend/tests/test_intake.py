import tempfile
import unittest
from pathlib import Path

from pydantic import ValidationError

from src.modules.intake.schemas import IntakeRequest
from src.modules.intake.repository import IntakeRepository
from src.modules.intake.service import get_intake, save_intake


class IntakeTests(unittest.TestCase):
    def test_valid_intake_returns_saved_response(self):
        request = IntakeRequest(
            patient_id="demo-patient",
            medicines=[{"name": "Vitamin D", "dose": "1000 IU", "frequency": "daily"}],
        )

        with tempfile.TemporaryDirectory() as directory:
            repository = IntakeRepository(Path(directory) / "test.db")
            response = save_intake(request, repository)
            saved = get_intake(response.intake_id, repository)

            self.assertTrue(response.intake_id.startswith("intake-"))
            self.assertEqual(response.status, "saved")
            self.assertEqual(saved.patient_id, "demo-patient")
            self.assertEqual(saved.medicines[0].name, "Vitamin D")

    def test_missing_intake_returns_none(self):
        with tempfile.TemporaryDirectory() as directory:
            repository = IntakeRepository(Path(directory) / "test.db")
            self.assertIsNone(get_intake("intake-missing", repository))

    def test_empty_medicine_list_is_rejected(self):
        with self.assertRaises(ValidationError):
            IntakeRequest(patient_id="demo-patient", medicines=[])


if __name__ == "__main__":
    unittest.main()
