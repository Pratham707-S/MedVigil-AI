from fastapi import APIRouter, status

from .schemas import IntakeRequest, IntakeResponse
from .service import save_intake

router = APIRouter(prefix="/intake", tags=["intake"])


@router.post("", response_model=IntakeResponse, status_code=status.HTTP_201_CREATED)
def create_intake(payload: IntakeRequest) -> IntakeResponse:
    return save_intake(payload)
