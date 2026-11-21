from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from .schemas import ClarificationQuestion


class TimelineMedicine(BaseModel):
    name: str
    dose: str = ""
    frequency: str = ""
    source: str


class TimelinePrescription(BaseModel):
    type: Literal["prescription"] = "prescription"
    prescription_id: str
    date: date
    source_filename: str = ""
    medicines: list[TimelineMedicine]


class TimelineIntake(BaseModel):
    intake_id: str
    medicines: list[TimelineMedicine]


class TimelineResponse(BaseModel):
    patient_id: str = Field(min_length=1)
    prescriptions: list[TimelinePrescription]
    intake: list[TimelineIntake]
    clarifications: list[ClarificationQuestion]
