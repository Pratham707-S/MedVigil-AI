# Integration owner: Pratham. Keep feature logic in the owned module boundaries.
from fastapi import FastAPI

from src.modules.intake.router import router as intake_router
from src.modules.prescriptions.router import router as prescriptions_router
from src.modules.reconciliation.router import router as reconciliation_router

app = FastAPI(title="MedVigil AI ORBIX API", version="0.1.0")
app.include_router(intake_router, prefix="/api/v1")
app.include_router(prescriptions_router, prefix="/api/v1")
app.include_router(reconciliation_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
