from typing import Literal

from pydantic import BaseModel, Field


class IntakeMedicine(BaseModel):
    name: str = Field(min_length=1)
    dose: str = ""
    frequency: str = ""
    source: Literal["patient-reported"] = "patient-reported"


class IntakeRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    medicines: list[IntakeMedicine] = Field(min_length=1)


class IntakeResponse(BaseModel):
    intake_id: str
    patient_id: str
    status: Literal["saved"] = "saved"
    medicines: list[IntakeMedicine]
