from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class PrescriptionMedicine(BaseModel):
    name: str = Field(min_length=1)
    dose: str = ""
    frequency: str = ""


class ConfirmedPrescription(BaseModel):
    prescription_id: str = Field(min_length=1)
    prescribed_on: date
    medicines: list[PrescriptionMedicine]
    stop_instructions: list[str] = Field(default_factory=list)


class ClarificationQuestion(BaseModel):
    medicine: PrescriptionMedicine
    question: str
    reviewer_status: Literal["needs_clarification"] = "needs_clarification"
    patient_instruction: None = None
