from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.pipeline_service import PipelineExecutionEngine
from app.services.job_manager import JobManager

router = APIRouter(prefix="/api/preprocessing", tags=["Data Processing & Preparation"])

class PreprocessingRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    dataset_id: str = "binary"
    train_ratio: float = Field(0.70, ge=0.50, le=0.85)
    val_ratio: float = Field(0.15, ge=0.05, le=0.25)
    test_ratio: float = Field(0.15, ge=0.05, le=0.25)
    random_state: int = 42
    remove_duplicates: bool = False
    scale_features: bool = True

@router.post("/run")
def run_preprocessing_pipeline(req: PreprocessingRequest):
    if round(req.train_ratio + req.val_ratio + req.test_ratio, 2) != 1.0:
        raise HTTPException(
            status_code=400,
            detail=f"Split ratios must sum to 1.0 (current sum: {req.train_ratio + req.val_ratio + req.test_ratio})"
        )

    job_id = JobManager.create_job("data_processing", req.model_dump(), total_stages=12)

    def pipeline_task(jid: str):
        return PipelineExecutionEngine.run_12_stage_pipeline(
            job_id=jid,
            dataset_id=req.dataset_id,
            train_ratio=req.train_ratio,
            val_ratio=req.val_ratio,
            test_ratio=req.test_ratio,
            random_state=req.random_state,
            remove_duplicates=req.remove_duplicates,
            scale_features=req.scale_features
        )

    JobManager.run_in_background(job_id, pipeline_task)
    return {
        "job_id": job_id,
        "status": "pending",
        "message": "12-stage data processing pipeline initiated in background."
    }

@router.get("/runs")
def list_processing_runs():
    return PipelineExecutionEngine.list_previous_runs()

@router.get("/runs/{run_id}")
def get_processing_run(run_id: str):
    details = PipelineExecutionEngine.get_run_details(run_id)
    if not details:
        job = JobManager.get_job(run_id)
        if job:
            return job
        raise HTTPException(status_code=404, detail=f"Processing run '{run_id}' not found.")
    return details

@router.post("/quality-check")
def run_data_quality_check(dataset_id: str = Query("binary")):
    try:
        return PipelineExecutionEngine.execute_data_quality_check(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/comparison")
def get_pandas_spark_comparison(workload_size: int = Query(253680, ge=10000)):
    try:
        return PipelineExecutionEngine.get_pandas_spark_comparison(workload_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
