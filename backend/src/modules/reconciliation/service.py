from .schemas import ClarificationQuestion, ConfirmedPrescription


def find_missing_stop_questions(
    older: ConfirmedPrescription,
    newer: ConfirmedPrescription,
) -> list[ClarificationQuestion]:
    """Find medicines omitted from a newer prescription without a stop note."""
    newer_names = {medicine.name.casefold() for medicine in newer.medicines}
    explicit_stops = {name.casefold() for name in newer.stop_instructions}

    questions = []
    for medicine in older.medicines:
        medicine_name = medicine.name.casefold()
        if medicine_name not in newer_names and medicine_name not in explicit_stops:
            questions.append(
                ClarificationQuestion(
                    medicine=medicine,
                    question=f"Are you still taking {medicine.name}?",
                )
            )
    return questions
