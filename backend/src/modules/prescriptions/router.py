from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from .extraction import ExtractionProvider
from .gemini_provider import GeminiConfigurationError, GeminiExtractionProvider
from .repository import DuplicatePrescriptionError, PrescriptionRepository
from .schemas import ConfirmPrescriptionRequest, ConfirmedPrescription, PrescriptionDraft

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = frozenset({"application/pdf", "image/jpeg", "image/png", "image/webp"})

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


def get_extraction_provider() -> ExtractionProvider:
    """Build the configured extraction provider for one request."""
    return GeminiExtractionProvider()


def get_prescription_repository() -> PrescriptionRepository:
    """Build the SQLite repository for one request."""
    return PrescriptionRepository()


@router.post("/upload", response_model=PrescriptionDraft, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    file: UploadFile = File(...),
    provider: ExtractionProvider = Depends(get_extraction_provider),
    patient_id: str = Form("demo-patient"),
) -> PrescriptionDraft:
    """Upload an image or PDF and return an editable AI extraction draft."""
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload must be a PDF, JPEG, PNG, or WebP file",
        )

    document = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(document) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Upload exceeds the 10 MiB demo limit",
        )
    if not document:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload is empty")

    resolved_patient_id = patient_id if isinstance(patient_id, str) else "demo-patient"
    if not resolved_patient_id.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Patient ID is required",
        )

    try:
        draft = await run_in_threadpool(provider.extract, document, mime_type)
        medicines = [
            {"name": medicine.name.strip(), "dose": medicine.dose, "frequency": medicine.frequency}
            for medicine in draft.medicines
            if medicine.name.strip()
        ]
        if not medicines:
            raise ValueError("No readable medicine names found")
        return PrescriptionDraft(
            prescription_id=f"draft-{uuid4().hex[:8]}",
            patient_id=resolved_patient_id.strip(),
            source_filename=file.filename or "upload",
            prescribed_on=draft.prescribed_on,
            medicines=medicines,
            needs_review=draft.needs_review,
        )
    except GeminiConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini extraction is not configured",
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to extract valid prescription data",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Prescription extraction failed",
        ) from error


@router.post("/{prescription_id}/confirm", response_model=ConfirmedPrescription)
def confirm_prescription(
    prescription_id: str,
    payload: ConfirmPrescriptionRequest,
    repository: PrescriptionRepository = Depends(get_prescription_repository),
) -> ConfirmedPrescription:
    """Persist the user-corrected draft as a confirmed prescription."""
    try:
        return repository.save_confirmed(prescription_id, payload)
    except DuplicatePrescriptionError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Prescription has already been confirmed",
        ) from error
