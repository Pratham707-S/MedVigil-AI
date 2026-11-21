from typing import Literal

from pydantic import BaseModel, Field

from src.modules.reconciliation.timeline import TimelineIntake, TimelinePrescription


class ReportMedicine(BaseModel):
    """A medicine item shown in the doctor-ready summary."""

    name: str = Field(min_length=1, description="Medicine or supplement name.")
    dose: str = Field(default="", description="Recorded dose, if available.")
    frequency: str = Field(default="", description="Recorded frequency, if available.")
    source: str = Field(description="Where this medicine entry came from, such as prescription or patient-reported.")


class ReportClarification(BaseModel):
    """A reviewer question that does not give the patient stop/continue advice."""

    medicine: str = Field(min_length=1, description="Medicine name requiring clarification.")
    question: str = Field(min_length=1, description="Question for the patient or reviewer.")
    reviewer_status: Literal["needs_clarification"] = Field(
        default="needs_clarification",
        description="Fixed reviewer status for an unresolved clarification.",
    )
    patient_instruction: None = Field(
        default=None,
        description="Always null; the summary must not tell the patient to stop or continue.",
    )


class MedicationSummary(BaseModel):
    """Doctor-ready medication summary assembled from reconciliation results."""

    patient_id: str = Field(min_length=1, description="Identifier for the patient.")
    title: str = Field(min_length=1, description="Human-readable summary title.")
    current_medications: list[ReportMedicine] = Field(
        description="Current medication items included in the summary.",
    )
    prescriptions: list[TimelinePrescription] = Field(
        default_factory=list,
        description="Patient-scoped confirmed prescription history with source references.",
    )
    intake: list[TimelineIntake] = Field(
        default_factory=list,
        description="Patient-scoped patient-reported medicines, including OTC entries.",
    )
    clarifications: list[ReportClarification] = Field(
        description="Unresolved questions that require reviewer clarification.",
    )
    review_note: str = Field(description="Note reminding reviewers how to use the summary.")
