from src.modules.intake.repository import IntakeRepository
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.reconciliation.service import find_missing_stop_questions
from src.modules.reconciliation.schemas import (
    ClarificationQuestion,
    ConfirmedPrescription as ReconciliationPrescription,
    PrescriptionMedicine as ReconciliationMedicine,
)

from .timeline import TimelineIntake, TimelineMedicine, TimelinePrescription, TimelineResponse


def _to_reconciliation_record(record) -> ReconciliationPrescription:
    return ReconciliationPrescription(
        prescription_id=record.prescription_id,
        prescribed_on=record.prescribed_on,
        medicines=[
            ReconciliationMedicine(name=medicine.name, dose=medicine.dose, frequency=medicine.frequency)
            for medicine in record.medicines
        ],
        stop_instructions=record.stop_instructions,
    )


def build_timeline(
    patient_id: str,
    prescription_repository: PrescriptionRepository | None = None,
    intake_repository: IntakeRepository | None = None,
) -> TimelineResponse:
    """Build a patient-scoped timeline and reconciliation result."""
    prescriptions = (prescription_repository or PrescriptionRepository()).list_confirmed(patient_id)
    intake_records = (intake_repository or IntakeRepository()).list_for_patient(patient_id)
    reconciliation_records = [_to_reconciliation_record(record) for record in prescriptions]

    clarifications: list[ClarificationQuestion] = []
    for older, newer in zip(reconciliation_records, reconciliation_records[1:]):
        clarifications.extend(find_missing_stop_questions(older, newer))

    prescription_events = [
        TimelinePrescription(
            prescription_id=record.prescription_id,
            date=record.prescribed_on,
            source_filename=record.source_filename,
            medicines=[
                TimelineMedicine(
                    name=medicine.name,
                    dose=medicine.dose,
                    frequency=medicine.frequency,
                    source=medicine.source,
                )
                for medicine in record.medicines
            ],
        )
        for record in prescriptions
    ]
    intake_events = [
        TimelineIntake(
            intake_id=record.intake_id,
            medicines=[
                TimelineMedicine(
                    name=medicine.name,
                    dose=medicine.dose,
                    frequency=medicine.frequency,
                    source=medicine.source,
                )
                for medicine in record.medicines
            ],
        )
        for record in intake_records
    ]
    return TimelineResponse(
        patient_id=patient_id,
        prescriptions=prescription_events,
        intake=intake_events,
        clarifications=clarifications,
    )
