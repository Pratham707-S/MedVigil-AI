from fastapi import APIRouter, status

from .schemas import IntakeRequest, IntakeResponse
from .service import save_intake

router = APIRouter(
    prefix="/intake",
    tags=["intake"],
)


@router.post(
    "",
    response_model=IntakeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record patient-reported medicines",
    description="Record medicines and over-the-counter products the patient reports taking.",
)
def create_intake(payload: IntakeRequest) -> IntakeResponse:
    """Validate and save a patient-reported intake submission."""
    return save_intake(payload)
