from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

from app.config import PROJECT_ROOT, RESEARCH_DISCLAIMER
from app.services.dataset_loader import DatasetLoader
from app.api import (
    datasets,
    preprocessing,
    training,
    predictions,
    explainability,
    stratification,
    benchmarks,
    reports,
    system
)

app = FastAPI(
    title="DiaRisk Analytics API",
    description="Explainable Diabetes Risk Intelligence on Big Data",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(datasets.router)
app.include_router(preprocessing.router)
app.include_router(training.router)
app.include_router(predictions.router)
app.include_router(explainability.router)
app.include_router(stratification.router)
app.include_router(benchmarks.router)
app.include_router(reports.router)
app.include_router(system.router)

@app.get("/api/health")
def health_check():
    dataset_status = DatasetLoader.get_available_datasets()
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "project_root": str(PROJECT_ROOT),
        "datasets": dataset_status,
        "disclaimer": RESEARCH_DISCLAIMER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
