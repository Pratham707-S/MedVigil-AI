from datetime import date
from typing import Protocol

from pydantic import BaseModel, Field


class ExtractedMedicine(BaseModel):
    """Editable medicine fields returned by an extraction provider."""

    name: str = ""
    dose: str = ""
    frequency: str = ""


class ExtractionDraft(BaseModel):
    """Provider-neutral prescription draft for user review before confirmation."""

    prescribed_on: date | None = None
    medicines: list[ExtractedMedicine] = Field(default_factory=list)
    needs_review: bool = False
    review_reasons: list[str] = Field(default_factory=list)


class ExtractionProvider(Protocol):
    """Interface implemented by a future OCR or vision provider adapter."""

    def extract(self, document: bytes, mime_type: str) -> ExtractionDraft:
        """Extract editable prescription fields from image or PDF bytes."""
        ...


def validate_extraction(draft: ExtractionDraft) -> ExtractionDraft:
    """Mark drafts with missing fields so a reviewer can complete them."""
    reasons = list(draft.review_reasons)

    if draft.prescribed_on is None:
        reasons.append("prescription date is missing")
    if not draft.medicines:
        reasons.append("no medicines were extracted")

    for index, medicine in enumerate(draft.medicines, start=1):
        if not medicine.name.strip():
            reasons.append(f"medicine {index} name is missing")
        if not medicine.dose.strip():
            reasons.append(f"medicine {index} dose is missing")
        if not medicine.frequency.strip():
            reasons.append(f"medicine {index} frequency is missing")

    return draft.model_copy(
        update={
            "needs_review": draft.needs_review or bool(reasons),
            "review_reasons": reasons,
        }
    )
