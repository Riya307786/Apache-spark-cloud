import uuid
import time
import json
import threading
from pathlib import Path
from typing import Dict, Any, Optional, Callable, List
from app.config import EXPERIMENTS_DIR

JOBS_PERSISTENCE_FILE = EXPERIMENTS_DIR / "jobs.json"

class JobManager:
    """
    Thread-safe background job tracker with JSON disk persistence.
    Survives application restarts and stores stage-level execution telemetry.
    """
    _jobs: Dict[str, Dict[str, Any]] = {}
    _lock = threading.Lock()
    _initialized = False

    @classmethod
    def _init_storage(cls):
        if cls._initialized:
            return
        cls._initialized = True
        if JOBS_PERSISTENCE_FILE.exists():
            try:
                with open(JOBS_PERSISTENCE_FILE, "r", encoding="utf-8") as f:
                    cls._jobs = json.load(f)
            except Exception:
                cls._jobs = {}

    @classmethod
    def _save_to_disk(cls):
        try:
            with open(JOBS_PERSISTENCE_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._jobs, f, indent=2)
        except Exception:
            pass

    @classmethod
    def create_job(cls, job_type: str, params: Optional[Dict[str, Any]] = None, total_stages: int = 1) -> str:
        cls._init_storage()
        job_id = f"{job_type}_{uuid.uuid4().hex[:8]}"
        with cls._lock:
            cls._jobs[job_id] = {
                "id": job_id,
                "type": job_type,
                "status": "pending",  # pending, running, completed, failed
                "progress": 0,
                "total_stages": total_stages,
                "current_stage": 0,
                "stages": [],
                "created_at": time.time(),
                "created_date": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
                "started_at": None,
                "completed_at": None,
                "duration_seconds": None,
                "params": params or {},
                "result": None,
                "error": None,
                "logs": [f"[{time.strftime('%H:%M:%S')}] Job {job_id} ({job_type}) registered."]
            }
            cls._save_to_disk()
        return job_id

    @classmethod
    def start_job(cls, job_id: str):
        cls._init_storage()
        with cls._lock:
            if job_id in cls._jobs:
                cls._jobs[job_id]["status"] = "running"
                cls._jobs[job_id]["started_at"] = time.time()
                cls._jobs[job_id]["logs"].append(f"[{time.strftime('%H:%M:%S')}] Job execution started.")
                cls._save_to_disk()

    @classmethod
    def update_progress(cls, job_id: str, progress: int, log_message: Optional[str] = None):
        cls._init_storage()
        with cls._lock:
            if job_id in cls._jobs:
                cls._jobs[job_id]["progress"] = min(max(progress, 0), 100)
                if log_message:
                    cls._jobs[job_id]["logs"].append(f"[{time.strftime('%H:%M:%S')}] {log_message}")
                cls._save_to_disk()

    @classmethod
    def update_stage(cls, job_id: str, stage_data: Dict[str, Any]):
        cls._init_storage()
        with cls._lock:
            if job_id in cls._jobs:
                job = cls._jobs[job_id]
                # Update or append stage
                existing = next((s for s in job["stages"] if s.get("stage_num") == stage_data.get("stage_num")), None)
                if existing:
                    existing.update(stage_data)
                else:
                    job["stages"].append(stage_data)
                job["current_stage"] = stage_data.get("stage_num", job["current_stage"])
                cls._save_to_disk()

    @classmethod
    def complete_job(cls, job_id: str, result: Dict[str, Any]):
        cls._init_storage()
        with cls._lock:
            if job_id in cls._jobs:
                job = cls._jobs[job_id]
                job["status"] = "completed"
                job["progress"] = 100
                job["completed_at"] = time.time()
                job["duration_seconds"] = round(job["completed_at"] - (job["started_at"] or job["created_at"]), 3)
                job["result"] = result
                job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Job completed successfully in {job['duration_seconds']}s.")
                cls._save_to_disk()

    @classmethod
    def fail_job(cls, job_id: str, error_message: str):
        cls._init_storage()
        with cls._lock:
            if job_id in cls._jobs:
                job = cls._jobs[job_id]
                job["status"] = "failed"
                job["completed_at"] = time.time()
                job["duration_seconds"] = round(job["completed_at"] - (job["started_at"] or job["created_at"]), 3)
                job["error"] = error_message
                job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Job failed: {error_message}")
                cls._save_to_disk()

    @classmethod
    def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        cls._init_storage()
        with cls._lock:
            return cls._jobs.get(job_id)

    @classmethod
    def list_jobs(cls, job_type: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        cls._init_storage()
        with cls._lock:
            jobs = list(cls._jobs.values())
            if job_type:
                jobs = [j for j in jobs if j.get("type") == job_type]
            sorted_jobs = sorted(jobs, key=lambda x: x.get("created_at", 0), reverse=True)
            return sorted_jobs[:limit]

    @classmethod
    def run_in_background(cls, job_id: str, target: Callable, *args, **kwargs):
        def worker():
            cls.start_job(job_id)
            try:
                result = target(job_id, *args, **kwargs)
                cls.complete_job(job_id, result)
            except Exception as e:
                import traceback
                trace = traceback.format_exc()
                cls.fail_job(job_id, f"{str(e)}\n{trace}")

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
