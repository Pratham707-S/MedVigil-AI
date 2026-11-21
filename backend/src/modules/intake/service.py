from .repository import IntakeRepository
from .schemas import IntakeRequest, IntakeResponse


def save_intake(payload: IntakeRequest, repository: IntakeRepository | None = None) -> IntakeResponse:
    return (repository or IntakeRepository()).save(payload)


def get_intake(intake_id: str, repository: IntakeRepository | None = None) -> IntakeResponse | None:
    return (repository or IntakeRepository()).get(intake_id)
