from src.modules.reconciliation.timeline import TimelineResponse

from .schemas import MedicationSummary, ReportClarification, ReportMedicine


def build_summary(timeline: TimelineResponse) -> MedicationSummary:
    """Assemble a summary directly from the patient-scoped timeline result."""
    current_medicines = []
    if timeline.prescriptions:
        current_medicines.extend(
            ReportMedicine(**medicine.model_dump())
            for medicine in timeline.prescriptions[-1].medicines
        )
    for intake in timeline.intake:
        current_medicines.extend(ReportMedicine(**medicine.model_dump()) for medicine in intake.medicines)

    clarifications = [
        ReportClarification(
            medicine=question.medicine.name,
            question=question.question,
            reviewer_status=question.reviewer_status,
            patient_instruction=None,
        )
        for question in timeline.clarifications
    ]
    return MedicationSummary(
        patient_id=timeline.patient_id,
        title="Medication reconciliation summary",
        current_medications=current_medicines,
        prescriptions=timeline.prescriptions,
        intake=timeline.intake,
        clarifications=clarifications,
        review_note="Resolve clarification questions with the patient before clinical decisions.",
    )
