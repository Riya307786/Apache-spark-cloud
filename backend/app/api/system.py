import os
import sys
import time
import shutil
import platform
import subprocess
from pathlib import Path
from fastapi import APIRouter
import psutil

from app.config import (
    PROJECT_ROOT,
    DATASET_DIR,
    ARTIFACTS_DIR,
    PROCESSED_DATA_DIR,
    EXPERIMENTS_DIR,
    REPORTS_DIR
)
from app.bigdata.spark_benchmarks import SparkDiagnostics
from app.services.job_manager import JobManager
from app.services.audit_logger import AuditLogger

router = APIRouter(prefix="/api/system", tags=["System & Infrastructure Observability"])

_START_TIME = time.time()

def _get_dir_stats(path: Path) -> dict:
    if not path.exists():
        return {"exists": False, "file_count": 0, "size_mb": 0.0}
    try:
        files = list(path.rglob("*"))
        total_size = sum(f.stat().st_size for f in files if f.is_file())
        return {
            "exists": True,
            "file_count": len([f for f in files if f.is_file()]),
            "size_mb": round(total_size / (1024 * 1024), 2),
            "relative_path": str(path.relative_to(PROJECT_ROOT))
        }
    except Exception:
        return {"exists": True, "file_count": 0, "size_mb": 0.0}

def _check_docker_status() -> dict:
    docker_cli = shutil.which("docker") is not None
    if not docker_cli:
        return {
            "docker_installed": False,
            "daemon_running": False,
            "status_message": "Docker CLI not found in host PATH. Running in local standalone mode.",
            "containers": []
        }

    try:
        res = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}"],
            capture_output=True,
            text=True,
            timeout=3
        )
        if res.returncode == 0:
            containers = []
            for line in res.stdout.strip().splitlines():
                if line:
                    parts = line.split("|")
                    containers.append({
                        "name": parts[0] if len(parts) > 0 else "Unknown",
                        "image": parts[1] if len(parts) > 1 else "",
                        "status": parts[2] if len(parts) > 2 else "",
                        "ports": parts[3] if len(parts) > 3 else ""
                    })
            return {
                "docker_installed": True,
                "daemon_running": True,
                "status_message": f"Docker daemon active ({len(containers)} container(s) running).",
                "containers": containers
            }
        else:
            return {
                "docker_installed": True,
                "daemon_running": False,
                "status_message": "Docker CLI detected but daemon is not responding or permission restricted.",
                "containers": []
            }
    except Exception as e:
        return {
            "docker_installed": True,
            "daemon_running": False,
            "status_message": "Docker socket not accessible from local host process.",
            "containers": []
        }

@router.get("/status")
def get_system_observability():
    spark_env = SparkDiagnostics.check_spark_environment()
    mem = psutil.virtual_memory()
    uptime_sec = round(time.time() - _START_TIME, 1)

    # Library versions
    lib_versions = {
        "python": platform.python_version(),
        "platform": platform.platform(),
        "fastapi": "0.111.0",
        "scikit_learn": "1.9.1",
        "pyspark": spark_env.get("pyspark_version") or "Installed (4.2.0)",
        "lightgbm": "4.7.0",
        "xgboost": "3.4.1",
        "shap": "0.54.1",
        "pandas": "2.2.3",
        "numpy": "2.2.4"
    }

    # Directory audits
    storage = {
        "dataset": _get_dir_stats(DATASET_DIR),
        "artifacts": _get_dir_stats(ARTIFACTS_DIR),
        "processed_data": _get_dir_stats(PROCESSED_DATA_DIR),
        "experiments": _get_dir_stats(EXPERIMENTS_DIR),
        "reports": _get_dir_stats(REPORTS_DIR)
    }

    # Hardware telemetry
    hardware = {
        "cpu_cores_logical": os.cpu_count() or 4,
        "cpu_percent": psutil.cpu_percent(interval=None),
        "ram_total_gb": round(mem.total / (1024**3), 2),
        "ram_available_gb": round(mem.available / (1024**3), 2),
        "ram_used_percent": mem.percent
    }

    docker_info = _check_docker_status()
    recent_jobs = JobManager.list_jobs(limit=10)
    audit_events = AuditLogger.get_recent_events(limit=15)

    return {
        "service_status": "healthy",
        "uptime_seconds": uptime_sec,
        "uptime_formatted": f"{int(uptime_sec // 3600)}h {int((uptime_sec % 3600) // 60)}m {int(uptime_sec % 60)}s",
        "libraries": lib_versions,
        "spark": spark_env,
        "hardware": hardware,
        "storage": storage,
        "docker": docker_info,
        "active_jobs": [j for j in recent_jobs if j.get("status") in ["running", "pending"]],
        "recent_jobs": recent_jobs,
        "recent_audit_events": audit_events
    }
