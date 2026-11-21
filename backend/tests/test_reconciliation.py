import unittest
from datetime import date

from src.modules.reconciliation.schemas import ConfirmedPrescription, PrescriptionMedicine
from src.modules.reconciliation.service import find_missing_stop_questions


def prescription(prescription_id, medicines, stop_instructions=None):
    return ConfirmedPrescription(
        prescription_id=prescription_id,
        prescribed_on=date(2026, 10, 1),
        medicines=[PrescriptionMedicine(name=name) for name in medicines],
        stop_instructions=stop_instructions or [],
    )


class MissingStopDetectorTests(unittest.TestCase):
    def test_missing_medicine_without_stop_instruction_needs_clarification(self):
        older = prescription("older", ["Lisinopril"])
        newer = prescription("newer", [])

        questions = find_missing_stop_questions(older, newer)

        self.assertEqual(len(questions), 1)
        self.assertEqual(questions[0].reviewer_status, "needs_clarification")
        self.assertEqual(questions[0].question, "Are you still taking Lisinopril?")
        self.assertIsNone(questions[0].patient_instruction)

    def test_explicit_stop_instruction_does_not_flag_medicine(self):
        older = prescription("older", ["Lisinopril"])
        newer = prescription("newer", [], ["lisinopril"])

        self.assertEqual(find_missing_stop_questions(older, newer), [])

    def test_unchanged_medicine_does_not_flag_medicine(self):
        older = prescription("older", ["Lisinopril"])
        newer = prescription("newer", ["lisinopril"])

        self.assertEqual(find_missing_stop_questions(older, newer), [])


if __name__ == "__main__":
    unittest.main()
