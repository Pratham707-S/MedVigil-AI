from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from .gemini_provider import (
    GeminiConfigurationError,
    GeminiExtractionProvider,
)
from .schemas import (
    ConfirmPrescriptionRequest,
    ConfirmedPrescription,
    PrescriptionDraft,
    PrescriptionMedicine,
)

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Temporary in-process storage for the MVP. Replace with a repository before
# running multiple workers or requiring data to survive a server restart.
_drafts: dict[str, PrescriptionDraft] = {}
_confirmed: dict[str, ConfirmedPrescription] = {}


@router.post(
    "/upload",
    response_model=PrescriptionDraft,
    status_code=status.HTTP_201_CREATED,
)
async def upload_prescription(
    file: UploadFile = File(...),
    patient_id: str = Form("demo-patient"),
) -> PrescriptionDraft:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and PDF files are supported",
        )

    if not patient_id.strip():
        raise HTTPException(
            status_code=422,
            detail="Patient ID is required",
        )

    document = await file.read(MAX_FILE_SIZE + 1)

    if not document:
        raise HTTPException(status_code=400, detail="File cannot be empty")

    if len(document) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    try:
        provider = GeminiExtractionProvider()

        # The existing Gemini SDK call is synchronous. Run it outside the
        # async event loop.
        from starlette.concurrency import run_in_threadpool

        extracted = await run_in_threadpool(
            provider.extract,
            document,
            file.content_type,
        )

    except GeminiConfigurationError:
        raise HTTPException(
            status_code=503,
            detail="Prescription extraction is not configured",
        )
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Unable to extract valid prescription data",
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Prescription extraction service failed",
        )

    medicines = [
        PrescriptionMedicine(
            name=medicine.name.strip(),
            dose=medicine.dose,
            frequency=medicine.frequency,
        )
        for medicine in extracted.medicines
        if medicine.name.strip()
    ]

    if not medicines:
        raise HTTPException(
            status_code=422,
            detail="No readable medicine names found; manual review required",
        )

    draft = PrescriptionDraft(
        prescription_id=str(uuid4()),
        patient_id=patient_id.strip(),
        source_filename=file.filename or "prescription",
        prescribed_on=extracted.prescribed_on,
        medicines=medicines,
        needs_review=True,
    )
    _drafts[draft.prescription_id] = draft
    return draft


@router.post(
    "/{prescription_id}/confirm",
    response_model=ConfirmedPrescription,
    status_code=status.HTTP_200_OK,
)
def confirm_prescription(
    prescription_id: str,
    payload: ConfirmPrescriptionRequest,
) -> ConfirmedPrescription:
    if prescription_id in _confirmed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Prescription is already confirmed",
        )

    draft = _drafts.get(prescription_id)
    if draft is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription draft not found",
        )

    if payload.patient_id != draft.patient_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Patient ID does not match the prescription draft",
        )

    confirmed = ConfirmedPrescription(
        prescription_id=prescription_id,
        patient_id=payload.patient_id,
        prescribed_on=payload.prescribed_on,
        medicines=payload.medicines,
    )
    _confirmed[prescription_id] = confirmed
    del _drafts[prescription_id]
    return confirmed
