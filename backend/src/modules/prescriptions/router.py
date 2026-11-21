from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from .extraction import ExtractionDraft, ExtractionProvider
from .gemini_provider import GeminiConfigurationError, GeminiExtractionProvider

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = frozenset({"application/pdf", "image/jpeg", "image/png", "image/webp"})

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


def get_extraction_provider() -> ExtractionProvider:
    """Build the configured extraction provider for one request."""
    return GeminiExtractionProvider()


@router.post("/upload", response_model=ExtractionDraft)
async def upload_prescription(
    file: UploadFile = File(...),
    provider: ExtractionProvider = Depends(get_extraction_provider),
) -> ExtractionDraft:
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

    try:
        return provider.extract(document, mime_type)
    except GeminiConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini extraction is not configured",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Prescription extraction failed",
        ) from error
