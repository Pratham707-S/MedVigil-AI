from uuid import uuid4

from .schemas import IntakeRequest, IntakeResponse


def save_intake(payload: IntakeRequest) -> IntakeResponse:
    """Build the response for a valid intake request.

    Persistence is intentionally left for a later step.
    """
    return IntakeResponse(
        intake_id=f"intake-{uuid4().hex[:8]}",
        patient_id=payload.patient_id,
        medicines=payload.medicines,
    )
