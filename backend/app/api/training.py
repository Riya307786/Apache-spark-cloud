from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.ml.trainer import ModelTrainer
from app.services.job_manager import JobManager

router = APIRouter(prefix="/api", tags=["Training & Models"])

class TrainingRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_type: str = "lightgbm" # logistic_regression, random_forest, xgboost, lightgbm
    dataset_id: str = "binary"
    pipeline_id: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None

@router.post("/training/start")
def start_training(req: TrainingRequest):
    job_id = JobManager.create_job("training", req.model_dump())

    def training_task(jid: str):
        def progress_cb(pct: int, msg: str):
            JobManager.update_progress(jid, pct, msg)

        res = ModelTrainer.train_model(
            model_type=req.model_type,
            pipeline_id=req.pipeline_id,
            dataset_id=req.dataset_id,
            hyperparameters=req.hyperparameters,
            progress_callback=progress_cb
        )
        return res

    JobManager.run_in_background(job_id, training_task)
    return {"job_id": job_id, "status": "pending", "message": f"Training job for {req.model_type} initiated."}

@router.get("/training/{job_id}")
def get_training_status(job_id: str):
    job = JobManager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return job

@router.get("/models")
def list_models():
    return ModelTrainer.list_models()

@router.get("/models/{model_id}/metrics")
def get_model_metrics(model_id: str):
    try:
        bundle = ModelTrainer.get_model_bundle(model_id)
        return {
            "model_id": bundle["model_id"],
            "model_type": bundle["model_type"],
            "dataset_id": bundle["dataset_id"],
            "training_time_seconds": bundle["training_time_seconds"],
            "validation_metrics": bundle["validation_metrics"],
            "test_metrics": bundle["test_metrics"],
            "hyperparameters": bundle["hyperparameters"],
            "created_date": bundle["created_date"]
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/models/{model_id}/activate")
def activate_model(model_id: str):
    try:
        ModelTrainer.set_active_model(model_id)
        return {"status": "success", "active_model_id": model_id}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
