import unittest

from pydantic import ValidationError

from src.modules.intake.schemas import IntakeRequest
from src.modules.intake.service import save_intake


class IntakeTests(unittest.TestCase):
    def test_valid_intake_returns_saved_response(self):
        request = IntakeRequest(
            patient_id="demo-patient",
            medicines=[{"name": "Vitamin D", "dose": "1000 IU", "frequency": "daily"}],
        )

        response = save_intake(request)

        self.assertTrue(response.intake_id.startswith("intake-"))
        self.assertEqual(response.status, "saved")
        self.assertEqual(response.medicines[0].source, "patient-reported")

    def test_empty_medicine_list_is_rejected(self):
        with self.assertRaises(ValidationError):
            IntakeRequest(patient_id="demo-patient", medicines=[])


if __name__ == "__main__":
    unittest.main()
