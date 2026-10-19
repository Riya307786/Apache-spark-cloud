import time
from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    brier_score_loss,
    roc_curve,
    precision_recall_curve
)
from sklearn.calibration import calibration_curve

class ModelMetricsCalculator:
    @staticmethod
    def calculate_comprehensive_metrics(
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        threshold: float = 0.50,
        model=None,
        X_sample: np.ndarray = None
    ) -> Dict[str, Any]:
        """
        Computes clinical research metrics, curves, and calibration.
        """
        y_true = np.asarray(y_true).astype(int)
        y_pred = (y_pred_proba >= threshold).astype(int)

        # Basic confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = 0, 0, 0, int(np.sum(y_true == y_pred))

        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        sensitivity = float(recall_score(y_true, y_pred, zero_division=0))
        precision = float(precision_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        brier = float(brier_score_loss(y_true, y_pred_proba))

        try:
            roc_auc = float(roc_auc_score(y_true, y_pred_proba))
        except Exception:
            roc_auc = 0.5

        try:
            pr_auc = float(average_precision_score(y_true, y_pred_proba))
        except Exception:
            pr_auc = float(np.mean(y_true))

        # ROC Curve points (subsampled to 50 for fast JSON transmission)
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        indices = np.linspace(0, len(fpr) - 1, 50, dtype=int)
        roc_data = [
            {"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)}
            for i in indices
        ]

        # PR Curve points
        precs, recs, _ = precision_recall_curve(y_true, y_pred_proba)
        pr_indices = np.linspace(0, len(precs) - 1, 50, dtype=int)
        pr_data = [
            {"recall": round(float(recs[i]), 4), "precision": round(float(precs[i]), 4)}
            for i in pr_indices
        ]

        # Calibration curve (10 bins)
        prob_true, prob_pred = calibration_curve(y_true, y_pred_proba, n_bins=10, strategy="uniform")
        calibration_data = [
            {
                "bin": i + 1,
                "pred_prob": round(float(prob_pred[i]), 4),
                "true_prob": round(float(prob_true[i]), 4),
                "perfect": round(float(prob_pred[i]), 4)
            }
            for i in range(len(prob_pred))
        ]

        # Measure inference latency if sample provided
        latency_ms_per_record = 0.0
        if model is not None and X_sample is not None:
            n_eval = min(len(X_sample), 1000)
            sample_sub = X_sample[:n_eval]
            t0 = time.perf_counter()
            _ = model.predict_proba(sample_sub)
            t1 = time.perf_counter()
            latency_ms_per_record = round(((t1 - t0) / n_eval) * 1000, 4)

        return {
            "threshold": threshold,
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "precision": round(precision, 4),
            "recall": round(sensitivity, 4),
            "sensitivity": round(sensitivity, 4),
            "specificity": round(specificity, 4),
            "f1_score": round(f1, 4),
            "brier_score": round(brier, 4),
            "confusion_matrix": {
                "tn": int(tn),
                "fp": int(fp),
                "fn": int(fn),
                "tp": int(tp),
                "total": int(tn + fp + fn + tp)
            },
            "calibration_curve": calibration_data,
            "roc_curve": roc_data,
            "pr_curve": pr_data,
            "inference_latency_ms": latency_ms_per_record
        }
