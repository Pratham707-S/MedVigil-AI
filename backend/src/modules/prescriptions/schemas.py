from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

class PrescriptionMedicine(BaseModel):
    name: str = Field(min_length=1)
    dose: str = ""
    frequency: str = ""
    source: Literal["prescription"] = "prescription"


class PrescriptionDraft(BaseModel):
    prescription_id: str
    patient_id: str
    status: Literal["draft"] = "draft"
    source_filename: str
    prescribed_on: date | None = None
    medicines: list[PrescriptionMedicine]
    needs_review: bool = True


class ConfirmPrescriptionRequest(BaseModel):
    patient_id: str
    prescribed_on: date
    medicines: list[PrescriptionMedicine] = Field(min_length=1)
    source_filename: str = ""


class ConfirmedPrescription(BaseModel):
    prescription_id: str
    patient_id: str
    status: Literal["confirmed"] = "confirmed"
    prescribed_on: date
    medicines: list[PrescriptionMedicine]
    source_filename: str = ""
