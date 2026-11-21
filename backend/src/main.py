# Integration owner: Pratham. Keep feature logic in the owned module boundaries.
from fastapi import FastAPI

from src.modules.intake.router import router as intake_router

app = FastAPI(title="MedVigil AI ORBIX API", version="0.1.0")
app.include_router(intake_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
