import re

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from src.modules.intake.repository import IntakeRepository
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.reconciliation.timeline import TimelineResponse
from src.modules.reconciliation.timeline_service import build_timeline

from .export import render_summary
from .schemas import MedicationSummary
from .service import build_summary

router = APIRouter(prefix="/summary", tags=["reports"])


def get_prescription_repository() -> PrescriptionRepository:
    return PrescriptionRepository()


def get_intake_repository() -> IntakeRepository:
    return IntakeRepository()


def read_timeline(
    patient_id: str,
    prescription_repository: PrescriptionRepository,
    intake_repository: IntakeRepository,
) -> TimelineResponse:
    return build_timeline(patient_id, prescription_repository, intake_repository)


@router.get("", response_model=MedicationSummary, summary="Preview a doctor-ready medication summary")
def summary(
    patient_id: str = Query(min_length=1),
    prescription_repository: PrescriptionRepository = Depends(get_prescription_repository),
    intake_repository: IntakeRepository = Depends(get_intake_repository),
) -> MedicationSummary:
    """Build a patient-scoped summary from the shared reconciliation timeline."""
    return build_summary(read_timeline(patient_id, prescription_repository, intake_repository))


@router.get("/download", response_class=PlainTextResponse, summary="Download a medication summary")
def download_summary(
    patient_id: str = Query(min_length=1),
    prescription_repository: PrescriptionRepository = Depends(get_prescription_repository),
    intake_repository: IntakeRepository = Depends(get_intake_repository),
) -> PlainTextResponse:
    """Render the same patient-scoped summary as deterministic plain text."""
    report = build_summary(read_timeline(patient_id, prescription_repository, intake_repository))
    safe_patient_id = re.sub(r"[^A-Za-z0-9_-]+", "-", patient_id).strip("-") or "patient"
    return PlainTextResponse(
        render_summary(report),
        headers={"Content-Disposition": f'attachment; filename="{safe_patient_id}-medication-summary.txt"'},
    )
