from .repository import IntakeRepository
from .schemas import IntakeRequest, IntakeResponse


def save_intake(payload: IntakeRequest, repository: IntakeRepository | None = None) -> IntakeResponse:
    """Validate-ready intake data and delegate persistence to the repository."""
    return (repository or IntakeRepository()).save(payload)


def get_intake(intake_id: str, repository: IntakeRepository | None = None) -> IntakeResponse | None:
    """Return one saved intake record, or None when the repository cannot find it."""
    return (repository or IntakeRepository()).get(intake_id)
