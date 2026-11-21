from src.modules.reconciliation.schemas import ClarificationQuestion

from .schemas import MedicationSummary, ReportClarification, ReportMedicine


def build_summary(
    patient_id: str,
    current_medicines: list[ReportMedicine],
    clarification_questions: list[ClarificationQuestion],
) -> MedicationSummary:
    """Assemble a summary from current medicines and reconciliation output."""
    clarifications = [
        ReportClarification(
            medicine=question.medicine.name,
            question=question.question,
            reviewer_status=question.reviewer_status,
            patient_instruction=None,
        )
        for question in clarification_questions
    ]
    return MedicationSummary(
        patient_id=patient_id,
        title="Medication reconciliation summary",
        current_medications=current_medicines,
        clarifications=clarifications,
        review_note="Resolve clarification questions with the patient before clinical decisions.",
    )
