# Integration owner: Pratham. Keep feature logic in the owned module boundaries.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.modules.intake.router import router as intake_router
from src.modules.prescriptions.router import router as prescriptions_router
from src.modules.reconciliation.router import router as reconciliation_router
from src.modules.reports.router import router as reports_router

settings = get_settings()
settings.validate_for_production()
app = FastAPI(title="MedVigil AI ORBIX API", version="0.1.0")
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )
app.include_router(intake_router, prefix="/api/v1")
app.include_router(prescriptions_router, prefix="/api/v1")
app.include_router(reconciliation_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
