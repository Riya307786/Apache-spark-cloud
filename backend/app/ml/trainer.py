import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import lightgbm as lgb
import xgboost as xgb

from app.config import ARTIFACTS_DIR, PROJECT_ROOT
from app.ml.pipeline import PreprocessingPipeline
from app.ml.metrics import ModelMetricsCalculator
from app.services.audit_logger import AuditLogger

REGISTRY_PATH = ARTIFACTS_DIR / "registry.json"

class ModelTrainer:
    @classmethod
    def _get_registry(cls) -> Dict[str, Any]:
        if not REGISTRY_PATH.exists():
            return {"active_model_id": None, "models": {}}
        try:
            with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"active_model_id": None, "models": {}}

    @classmethod
    def _save_registry(cls, registry: Dict[str, Any]):
        with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
            json.dump(registry, f, indent=2)

    @classmethod
    def list_models(cls) -> List[Dict[str, Any]]:
        reg = cls._get_registry()
        models = list(reg.get("models", {}).values())
        active_id = reg.get("active_model_id")
        for m in models:
            m["is_active"] = (m["model_id"] == active_id)
        return sorted(models, key=lambda x: x.get("created_at", 0), reverse=True)

    @classmethod
    def get_model_bundle(cls, model_id: Optional[str] = None) -> Dict[str, Any]:
        reg = cls._get_registry()
        if not model_id:
            model_id = reg.get("active_model_id")
        if not model_id or model_id not in reg.get("models", {}):
            # If no active model in registry, check if any joblib exists
            models = list(reg.get("models", {}).keys())
            if models:
                model_id = models[0]
            else:
                raise ValueError("No trained model found. Please train a model first in the Model Laboratory.")

        artifact_file = ARTIFACTS_DIR / f"{model_id}.joblib"
        if not artifact_file.exists():
            raise FileNotFoundError(f"Model artifact {artifact_file} not found.")

        bundle = joblib.load(artifact_file)
        return bundle

    @classmethod
    def set_active_model(cls, model_id: str):
        reg = cls._get_registry()
        if model_id not in reg.get("models", {}):
            raise ValueError(f"Model ID '{model_id}' does not exist in registry.")
        reg["active_model_id"] = model_id
        cls._save_registry(reg)
        AuditLogger.log_event("set_active_model", {"model_id": model_id})

    @classmethod
    def train_model(
        cls,
        model_type: str = "lightgbm",
        pipeline_id: Optional[str] = None,
        dataset_id: str = "binary",
        hyperparameters: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Executes real training, validation tuning, test evaluation, and artifact serialization.
        """
        hyperparams = hyperparameters or {}
        seed = int(hyperparams.get("random_state", 42))

        # 1. Load or run preprocessing
        if progress_callback:
            progress_callback(10, "Preparing data splits...")

        if pipeline_id:
            data = PreprocessingPipeline.load_pipeline_splits(pipeline_id)
        else:
            prep = PreprocessingPipeline(random_state=seed)
            data = prep.prepare_data(
                dataset_id=dataset_id,
                train_ratio=float(hyperparams.get("train_ratio", 0.70)),
                val_ratio=float(hyperparams.get("val_ratio", 0.15)),
                test_ratio=float(hyperparams.get("test_ratio", 0.15)),
                remove_duplicates=bool(hyperparams.get("remove_duplicates", False)),
                scale_features=True
            )
            pipeline_id = data["pipeline_id"]

        X_train, y_train = data["X_train"], data["y_train"]
        X_val, y_val = data["X_val"], data["y_val"]
        X_test, y_test = data["X_test"], data["y_test"]
        X_test_raw = data["X_test_raw"]
        scaler = data.get("scaler")
        feature_columns = list(X_train.columns)

        # Imbalance ratio
        neg_count = int((y_train == 0).sum())
        pos_count = int((y_train == 1).sum())
        imbalance_ratio = max(neg_count / max(pos_count, 1), 1.0)

        if progress_callback:
            progress_callback(30, f"Initializing {model_type} algorithm...")

        # 2. Instantiate algorithm
        if model_type == "logistic_regression":
            model = LogisticRegression(
                C=float(hyperparams.get("C", 1.0)),
                max_iter=int(hyperparams.get("max_iter", 1000)),
                class_weight="balanced" if hyperparams.get("balanced_weights", True) else None,
                solver="lbfgs",
                random_state=seed
            )
        elif model_type == "random_forest":
            model = RandomForestClassifier(
                n_estimators=int(hyperparams.get("n_estimators", 100)),
                max_depth=int(hyperparams.get("max_depth", 12)),
                class_weight="balanced" if hyperparams.get("balanced_weights", True) else None,
                random_state=seed,
                n_jobs=-1
            )
        elif model_type == "xgboost":
            scale_pos = imbalance_ratio if hyperparams.get("balanced_weights", True) else 1.0
            model = xgb.XGBClassifier(
                n_estimators=int(hyperparams.get("n_estimators", 100)),
                max_depth=int(hyperparams.get("max_depth", 6)),
                learning_rate=float(hyperparams.get("learning_rate", 0.1)),
                scale_pos_weight=scale_pos,
                random_state=seed,
                eval_metric="logloss",
                n_jobs=-1
            )
        elif model_type == "lightgbm":
            model = lgb.LGBMClassifier(
                n_estimators=int(hyperparams.get("n_estimators", 100)),
                max_depth=int(hyperparams.get("max_depth", 6)),
                learning_rate=float(hyperparams.get("learning_rate", 0.1)),
                num_leaves=int(hyperparams.get("num_leaves", 31)),
                class_weight="balanced" if hyperparams.get("balanced_weights", True) else None,
                random_state=seed,
                n_jobs=-1,
                verbose=-1
            )
        else:
            raise ValueError(f"Unsupported model type '{model_type}'")

        if progress_callback:
            progress_callback(50, f"Fitting {model_type} on {len(X_train)} training records...")

        t_start = time.perf_counter()
        model.fit(X_train, y_train)
        training_time = round(time.perf_counter() - t_start, 3)

        if progress_callback:
            progress_callback(75, "Evaluating validation and test performance...")

        # 3. Predict probabilities
        val_probs = model.predict_proba(X_val)[:, 1]
        test_probs = model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        val_metrics = ModelMetricsCalculator.calculate_comprehensive_metrics(
            y_true=y_val,
            y_pred_proba=val_probs,
            threshold=0.50
        )

        test_metrics = ModelMetricsCalculator.calculate_comprehensive_metrics(
            y_true=y_test,
            y_pred_proba=test_probs,
            threshold=0.50,
            model=model,
            X_sample=X_test.to_numpy()
        )

        model_id = f"{model_type}_{int(time.time())}"
        
        # 4. Serialize model bundle
        bundle = {
            "model_id": model_id,
            "model_type": model_type,
            "estimator": model,
            "scaler": scaler,
            "pipeline_id": pipeline_id,
            "dataset_id": dataset_id,
            "feature_columns": feature_columns,
            "target_column": "Diabetes_binary",
            "training_time_seconds": training_time,
            "hyperparameters": hyperparams,
            "validation_metrics": val_metrics,
            "test_metrics": test_metrics,
            "created_at": time.time(),
            "created_date": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            # Sample for explainability (subsample of 500 test rows)
            "explain_sample_X": X_test.iloc[:500].copy(),
            "explain_sample_y": y_test.iloc[:500].copy(),
            "explain_sample_X_raw": X_test_raw.iloc[:500].copy()
        }

        artifact_path = ARTIFACTS_DIR / f"{model_id}.joblib"
        joblib.dump(bundle, artifact_path)

        # 5. Update Registry
        registry_entry = {
            "model_id": model_id,
            "model_type": model_type,
            "pipeline_id": pipeline_id,
            "dataset_id": dataset_id,
            "artifact_file": f"artifacts/{model_id}.joblib",
            "training_time": training_time,
            "test_roc_auc": test_metrics["roc_auc"],
            "test_pr_auc": test_metrics["pr_auc"],
            "test_f1": test_metrics["f1_score"],
            "test_recall": test_metrics["recall"],
            "test_precision": test_metrics["precision"],
            "test_brier": test_metrics["brier_score"],
            "inference_latency_ms": test_metrics["inference_latency_ms"],
            "hyperparameters": hyperparams,
            "created_at": bundle["created_at"],
            "created_date": bundle["created_date"]
        }

        reg = cls._get_registry()
        reg["models"][model_id] = registry_entry
        # If this is the first model or higher ROC-AUC, make it active
        if reg["active_model_id"] is None or test_metrics["roc_auc"] > reg.get("models", {}).get(reg["active_model_id"], {}).get("test_roc_auc", 0):
            reg["active_model_id"] = model_id
        cls._save_registry(reg)

        AuditLogger.log_event("train_model", {
            "model_id": model_id,
            "model_type": model_type,
            "test_roc_auc": test_metrics["roc_auc"],
            "training_time": training_time
        })

        if progress_callback:
            progress_callback(100, f"Model training complete. Test ROC-AUC: {test_metrics['roc_auc']:.4f}")

        return {
            "model_id": model_id,
            "model_type": model_type,
            "training_time": training_time,
            "test_metrics": test_metrics,
            "val_metrics": val_metrics,
            "is_active": (reg["active_model_id"] == model_id)
        }
