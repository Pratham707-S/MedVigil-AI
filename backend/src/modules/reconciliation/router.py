from fastapi import APIRouter, Depends, Query

from src.modules.intake.repository import IntakeRepository
from src.modules.prescriptions.repository import PrescriptionRepository

from .timeline import TimelineResponse
from .timeline_service import build_timeline

router = APIRouter(prefix="/timeline", tags=["reconciliation"])


def get_prescription_repository() -> PrescriptionRepository:
    return PrescriptionRepository()


def get_intake_repository() -> IntakeRepository:
    return IntakeRepository()


@router.get("", response_model=TimelineResponse, summary="Read a patient's medication timeline")
def timeline(
    patient_id: str = Query(min_length=1),
    prescription_repository: PrescriptionRepository = Depends(get_prescription_repository),
    intake_repository: IntakeRepository = Depends(get_intake_repository),
) -> TimelineResponse:
    """Return patient-scoped prescription history, intake, and flags."""
    return build_timeline(patient_id, prescription_repository, intake_repository)
