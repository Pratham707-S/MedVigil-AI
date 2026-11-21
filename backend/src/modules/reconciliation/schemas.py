from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class PrescriptionMedicine(BaseModel):
    """Medicine details used when comparing confirmed prescriptions."""

    name: str = Field(min_length=1, description="Medicine name to compare across prescriptions.")
    dose: str = Field(default="", description="Recorded dose, if available.")
    frequency: str = Field(default="", description="Recorded frequency, if available.")


class ConfirmedPrescription(BaseModel):
    """A confirmed prescription record used as reconciliation input."""

    prescription_id: str = Field(min_length=1, description="Identifier for the confirmed prescription.")
    prescribed_on: date = Field(description="Date on which the prescription was issued.")
    medicines: list[PrescriptionMedicine] = Field(description="Medicines present on this prescription.")
    stop_instructions: list[str] = Field(
        default_factory=list,
        description="Medicine names with an explicit stop instruction on this prescription.",
    )


class ClarificationQuestion(BaseModel):
    """A reviewer-facing question, never a patient stop/continue instruction."""

    medicine: PrescriptionMedicine = Field(description="Medicine requiring reviewer clarification.")
    question: str = Field(description="Question to resolve with the patient or reviewer.")
    reviewer_status: Literal["needs_clarification"] = Field(
        default="needs_clarification",
        description="Fixed status indicating that clarification is required.",
    )
    patient_instruction: None = Field(
        default=None,
        description="Always null; the detector must not tell a patient to stop or continue.",
    )
