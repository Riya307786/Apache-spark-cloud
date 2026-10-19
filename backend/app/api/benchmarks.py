from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.bigdata.parallel_benchmarks import ParallelBenchmarkEngine
from app.bigdata.spark_benchmarks import SparkDiagnostics
from app.services.job_manager import JobManager

router = APIRouter(prefix="/api/benchmarks", tags=["Big Data & Benchmarks"])

class BenchmarkRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    workload_size: int = Field(253680, ge=10000, le=5000000)
    workers: Optional[int] = Field(None, ge=1, le=32)

@router.get("/spark-status")
def get_spark_status():
    return SparkDiagnostics.check_spark_environment()

@router.post("/start")
def start_parallel_benchmark(req: BenchmarkRequest):
    job_id = JobManager.create_job("scalability_benchmark", req.model_dump())

    def benchmark_task(jid: str):
        def progress_cb(pct: int, msg: str):
            JobManager.update_progress(jid, pct, msg)

        res = ParallelBenchmarkEngine.run_scalability_benchmark(
            workload_size=req.workload_size,
            n_workers=req.workers,
            progress_callback=progress_cb
        )
        return res

    JobManager.run_in_background(job_id, benchmark_task)
    return {"job_id": job_id, "status": "pending", "message": f"Benchmark for {req.workload_size:,} records initiated."}

@router.post("/spark/start")
def start_spark_benchmark(req: BenchmarkRequest):
    diag = SparkDiagnostics.check_spark_environment()
    if not diag["spark_available"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "PySpark execution requires a Java Virtual Machine (JVM). "
                "Java runtime was not detected in the host environment PATH. "
                "Per research integrity guidelines, completed Spark jobs are never faked. "
                "Use 'docker-compose up' to run in the containerized Spark environment."
            )
        )

    job_id = JobManager.create_job("spark_benchmark", req.model_dump())

    def spark_task(jid: str):
        return SparkDiagnostics.run_spark_benchmark(req.workload_size)

    JobManager.run_in_background(job_id, spark_task)
    return {"job_id": job_id, "status": "pending", "message": "Spark benchmark initiated."}

@router.get("/history")
def get_benchmark_history():
    jobs = JobManager.list_jobs(job_type="scalability_benchmark", limit=20)
    spark_jobs = JobManager.list_jobs(job_type="spark_benchmark", limit=10)
    return {
        "parallel_benchmarks": jobs,
        "spark_benchmarks": spark_jobs
    }

@router.get("/{job_id}")
def get_benchmark_job(job_id: str):
    job = JobManager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Benchmark job '{job_id}' not found.")
    return job
