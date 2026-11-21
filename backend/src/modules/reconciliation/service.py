from .schemas import ClarificationQuestion, ConfirmedPrescription


def _normalize_medicine_name(name: str) -> str:
    """Normalize names for safe comparison without changing displayed text."""
    return name.strip().casefold()


def find_missing_stop_questions(
    older: ConfirmedPrescription,
    newer: ConfirmedPrescription,
) -> list[ClarificationQuestion]:
    """Find medicines omitted from a newer prescription without a stop note."""
    newer_names = {_normalize_medicine_name(medicine.name) for medicine in newer.medicines}
    explicit_stops = {_normalize_medicine_name(name) for name in newer.stop_instructions}

    questions = []
    for medicine in older.medicines:
        medicine_name = _normalize_medicine_name(medicine.name)
        if medicine_name not in newer_names and medicine_name not in explicit_stops:
            questions.append(
                ClarificationQuestion(
                    medicine=medicine,
                    question=f"Are you still taking {medicine.name}?",
                )
            )
    return questions
