import time
from fastapi import APIRouter, HTTPException, Response
from typing import Dict, Any, Optional
from app.services.dataset_loader import DatasetLoader
from app.ml.trainer import ModelTrainer
from app.stratification.risk_engine import RiskStratificationEngine
from app.bigdata.spark_benchmarks import SparkDiagnostics
from app.services.audit_logger import AuditLogger
from app.config import RESEARCH_DISCLAIMER

router = APIRouter(prefix="/api/reports", tags=["Reports & Experiments"])

@router.get("/generate")
def generate_full_research_report(model_id: Optional[str] = None):
    try:
        # 1. Dataset stats
        ds_summary = DatasetLoader.get_summary("binary")
        
        # 2. Model stats
        models_list = ModelTrainer.list_models()
        active_bundle = None
        stratification_summary = None
        if models_list:
            active_bundle = ModelTrainer.get_model_bundle(model_id)
            stratification_summary = RiskStratificationEngine.evaluate_stratification(
                model_id=active_bundle["model_id"]
            )

        # 3. Spark status
        spark_env = SparkDiagnostics.check_spark_environment()

        report = {
            "title": "DiaRisk Analytics: Research & Evaluation Technical Report",
            "tagline": "Explainable Diabetes Risk Intelligence on Big Data",
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "project_name": "LP2 Mini Project - DiaRisk Analytics",
            "dataset_overview": {
                "dataset_name": "CDC Behavioral Risk Factor Surveillance System (BRFSS 2015)",
                "total_respondents": ds_summary["total_rows"],
                "total_features": ds_summary["feature_count"],
                "target_definition": "Diabetes_binary (0: No diabetes/prediabetes, 1: Diagnosed diabetes)",
                "diabetes_prevalence": f"{ds_summary['prevalence_percent']}% ({ds_summary['target_distribution'].get('1', 0):,} respondents)",
                "imbalance_ratio": ds_summary["imbalance_ratio"],
                "duplicate_rows": ds_summary["duplicate_rows"],
                "duplicate_policy": ds_summary["duplicate_policy_note"]
            },
            "preprocessing_methodology": {
                "splitting_strategy": "Stratified random split (70% Train, 15% Validation, 15% Test)",
                "leakage_prevention": "Scaling and normalization fit exclusively on training partition",
                "resampling_policy": "No synthetic oversampling applied to validation or test evaluation partitions",
                "random_seed": 42
            },
            "model_benchmarking": {
                "models_trained_count": len(models_list),
                "model_comparison": [
                    {
                        "model_id": m["model_id"],
                        "type": m["model_type"],
                        "test_roc_auc": m.get("test_roc_auc"),
                        "test_pr_auc": m.get("test_pr_auc"),
                        "test_f1": m.get("test_f1"),
                        "test_recall": m.get("test_recall"),
                        "test_precision": m.get("test_precision"),
                        "inference_latency_ms": m.get("inference_latency_ms"),
                        "training_time_s": m.get("training_time")
                    }
                    for m in models_list
                ],
                "active_model": active_bundle["model_id"] if active_bundle else "None"
            },
            "risk_stratification_findings": stratification_summary,
            "big_data_infrastructure": {
                "spark_status": spark_env["status"],
                "parallel_engine": "Multi-core parallel chunking pipeline",
                "cluster_containerization": "Docker Compose ready"
            },
            "clinical_and_ethical_limitations": {
                "cross_sectional_nature": (
                    "BRFSS 2015 is a cross-sectional telephone survey. Outcomes reflect self-reported "
                    "pre-existing diagnoses at the time of interview, not prospective future onset."
                ),
                "shap_interpretation": (
                    "SHAP feature attributions reflect mathematical contributions to model predictions "
                    "and do not constitute clinical causality."
                ),
                "disclaimer": RESEARCH_DISCLAIMER
            }
        }
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/experiments")
def get_experiments_log():
    return AuditLogger.get_recent_events(limit=50)
