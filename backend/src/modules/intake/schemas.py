from typing import Literal

from pydantic import BaseModel, Field


class IntakeMedicine(BaseModel):
    name: str = Field(min_length=1, description="Medicine or supplement name reported by the patient.")
    dose: str = Field(default="", description="Patient-reported dose, if known.")
    frequency: str = Field(default="", description="Patient-reported frequency, if known.")
    source: Literal["patient-reported"] = Field(
        default="patient-reported",
        description="Origin of this medicine entry; intake entries are patient-reported.",
    )


class IntakeRequest(BaseModel):
    patient_id: str = Field(min_length=1, description="Identifier for the patient submitting the intake.")
    medicines: list[IntakeMedicine] = Field(
        min_length=1,
        description="One or more medicines or supplements the patient reports taking.",
    )


class IntakeResponse(BaseModel):
    intake_id: str
    patient_id: str
    status: Literal["saved"] = "saved"
    medicines: list[IntakeMedicine]
