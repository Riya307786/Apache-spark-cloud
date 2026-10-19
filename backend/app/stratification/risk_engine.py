import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score

from app.ml.trainer import ModelTrainer
from app.config import RESEARCH_DISCLAIMER

class RiskStratificationEngine:
    @staticmethod
    def _wilson_score_interval(positives: int, total: int, confidence: float = 0.95) -> Dict[str, float]:
        """
        Calculates 95% Wilson score confidence interval for binomial proportion.
        """
        if total == 0:
            return {"lower": 0.0, "upper": 0.0}
        z = 1.96 if confidence == 0.95 else 1.645
        p = positives / total
        denominator = 1 + (z**2) / total
        centre_adjusted_probability = p + (z**2) / (2 * total)
        adjusted_standard_deviation = math.sqrt((p * (1 - p) + (z**2) / (4 * total)) / total)
        lower_bound = (centre_adjusted_probability - z * adjusted_standard_deviation) / denominator
        upper_bound = (centre_adjusted_probability + z * adjusted_standard_deviation) / denominator
        return {
            "lower": round(max(0.0, lower_bound) * 100, 2),
            "upper": round(min(1.0, upper_bound) * 100, 2)
        }

    @classmethod
    def evaluate_stratification(
        cls,
        model_id: Optional[str] = None,
        lower_threshold: float = 0.20,
        upper_threshold: float = 0.50
    ) -> Dict[str, Any]:
        """
        Performs 3-tier risk stratification on held-out test data.
        """
        bundle = ModelTrainer.get_model_bundle(model_id)
        current_model_id = bundle["model_id"]
        model = bundle["estimator"]
        
        # Test sample
        X_test = bundle["explain_sample_X"]
        y_test = bundle["explain_sample_y"].to_numpy().astype(int)
        X_raw = bundle.get("explain_sample_X_raw", X_test)

        probs = model.predict_proba(X_test)[:, 1]
        n_total = len(y_test)

        # Classify into 3 tiers
        is_lower = probs < lower_threshold
        is_intermediate = (probs >= lower_threshold) & (probs < upper_threshold)
        is_higher = probs >= upper_threshold

        tiers = [
            {
                "id": "lower",
                "label": "Lower Model-Estimated Risk",
                "threshold_range": f"< {round(lower_threshold * 100, 1)}%",
                "count": int(np.sum(is_lower)),
                "proportion": round(float(np.mean(is_lower)) * 100, 2),
                "positives": int(np.sum(y_test[is_lower])),
                "observed_rate": round(float(np.mean(y_test[is_lower])) * 100, 2) if np.sum(is_lower) > 0 else 0.0,
                "ci_95": cls._wilson_score_interval(int(np.sum(y_test[is_lower])), int(np.sum(is_lower)))
            },
            {
                "id": "intermediate",
                "label": "Intermediate Model-Estimated Risk",
                "threshold_range": f"{round(lower_threshold * 100, 1)}% – {round(upper_threshold * 100, 1)}%",
                "count": int(np.sum(is_intermediate)),
                "proportion": round(float(np.mean(is_intermediate)) * 100, 2),
                "positives": int(np.sum(y_test[is_intermediate])),
                "observed_rate": round(float(np.mean(y_test[is_intermediate])) * 100, 2) if np.sum(is_intermediate) > 0 else 0.0,
                "ci_95": cls._wilson_score_interval(int(np.sum(y_test[is_intermediate])), int(np.sum(is_intermediate)))
            },
            {
                "id": "higher",
                "label": "Higher Model-Estimated Risk",
                "threshold_range": f"≥ {round(upper_threshold * 100, 1)}%",
                "count": int(np.sum(is_higher)),
                "proportion": round(float(np.mean(is_higher)) * 100, 2),
                "positives": int(np.sum(y_test[is_higher])),
                "observed_rate": round(float(np.mean(y_test[is_higher])) * 100, 2) if np.sum(is_higher) > 0 else 0.0,
                "ci_95": cls._wilson_score_interval(int(np.sum(y_test[is_higher])), int(np.sum(is_higher)))
            }
        ]

        # Clinical high-risk tier screening performance
        y_pred_higher = is_higher.astype(int)
        sensitivity = float(recall_score(y_test, y_pred_higher, zero_division=0))
        precision = float(precision_score(y_test, y_pred_higher, zero_division=0))
        f1 = float(f1_score(y_test, y_pred_higher, zero_division=0))

        # Subgroup analysis on test set
        subgroups = []
        if "Sex" in X_raw.columns:
            for s_val, s_name in [(0.0, "Female"), (1.0, "Male")]:
                mask = (X_raw["Sex"] == s_val).to_numpy()
                if np.sum(mask) > 10:
                    sub_y = y_test[mask]
                    sub_p = probs[mask]
                    sub_high = sub_p >= upper_threshold
                    subgroups.append({
                        "category": "Biological Sex",
                        "group": s_name,
                        "count": int(np.sum(mask)),
                        "high_risk_share": round(float(np.mean(sub_high)) * 100, 2),
                        "observed_prevalence": round(float(np.mean(sub_y)) * 100, 2),
                        "high_risk_observed_rate": round(float(np.mean(sub_y[sub_high])) * 100, 2) if np.sum(sub_high) > 0 else 0.0
                    })

        if "Age" in X_raw.columns:
            # BRFSS Age: 1-6 (<50) vs 7-13 (>=50)
            younger_mask = (X_raw["Age"] < 7).to_numpy()
            older_mask = (X_raw["Age"] >= 7).to_numpy()
            for mask, name in [(younger_mask, "Age < 50 (Brackets 1-6)"), (older_mask, "Age ≥ 50 (Brackets 7-13)")]:
                if np.sum(mask) > 10:
                    sub_y = y_test[mask]
                    sub_p = probs[mask]
                    sub_high = sub_p >= upper_threshold
                    subgroups.append({
                        "category": "Age Cohort",
                        "group": name,
                        "count": int(np.sum(mask)),
                        "high_risk_share": round(float(np.mean(sub_high)) * 100, 2),
                        "observed_prevalence": round(float(np.mean(sub_y)) * 100, 2),
                        "high_risk_observed_rate": round(float(np.mean(sub_y[sub_high])) * 100, 2) if np.sum(sub_high) > 0 else 0.0
                    })

        if "BMI" in X_raw.columns:
            normal_bmi = (X_raw["BMI"] < 25).to_numpy()
            overweight_bmi = ((X_raw["BMI"] >= 25) & (X_raw["BMI"] < 30)).to_numpy()
            obese_bmi = (X_raw["BMI"] >= 30).to_numpy()
            for mask, name in [(normal_bmi, "BMI < 25 (Normal)"), (overweight_bmi, "BMI 25–29.9 (Overweight)"), (obese_bmi, "BMI ≥ 30 (Obese)")]:
                if np.sum(mask) > 10:
                    sub_y = y_test[mask]
                    sub_p = probs[mask]
                    sub_high = sub_p >= upper_threshold
                    subgroups.append({
                        "category": "BMI Category",
                        "group": name,
                        "count": int(np.sum(mask)),
                        "high_risk_share": round(float(np.mean(sub_high)) * 100, 2),
                        "observed_prevalence": round(float(np.mean(sub_y)) * 100, 2),
                        "high_risk_observed_rate": round(float(np.mean(sub_y[sub_high])) * 100, 2) if np.sum(sub_high) > 0 else 0.0
                    })

        # Threshold sensitivity sweep
        sensitivity_sweep = []
        for t in np.linspace(0.1, 0.9, 9):
            pred_t = (probs >= t).astype(int)
            sensitivity_sweep.append({
                "threshold": round(float(t), 2),
                "proportion_flagged": round(float(np.mean(pred_t)) * 100, 2),
                "sensitivity": round(float(recall_score(y_test, pred_t, zero_division=0)), 3),
                "precision": round(float(precision_score(y_test, pred_t, zero_division=0)), 3),
                "f1": round(float(f1_score(y_test, pred_t, zero_division=0)), 3)
            })

        return {
            "model_id": current_model_id,
            "threshold_policy": {
                "method": "Validation Quantile & Empirical Risk Cutoff",
                "lower_threshold": lower_threshold,
                "upper_threshold": upper_threshold,
                "justification": (
                    "Thresholds partition participants based on predicted posterior odds. "
                    "These bands represent statistical risk stratification within CDC survey data "
                    "and are not clinically validated diagnostic cutoff standards."
                )
            },
            "tiers": tiers,
            "high_risk_tier_metrics": {
                "sensitivity": round(sensitivity, 4),
                "precision": round(precision, 4),
                "f1_score": round(f1, 4)
            },
            "subgroup_analysis": subgroups,
            "sensitivity_sweep": sensitivity_sweep,
            "disclaimer": RESEARCH_DISCLAIMER
        }

    @classmethod
    def assign_patient_risk_tier(cls, probability: float, lower_threshold: float = 0.20, upper_threshold: float = 0.50) -> Dict[str, Any]:
        if probability < lower_threshold:
            tier_id = "lower"
            tier_name = "Lower Model-Estimated Risk"
            badge_color = "status-success"
            action_guidance = "Routine primary care checkup schedule; reinforce lifestyle and nutrition health maintenance."
        elif probability < upper_threshold:
            tier_id = "intermediate"
            tier_name = "Intermediate Model-Estimated Risk"
            badge_color = "status-warning"
            action_guidance = "Consider confirmatory laboratory screening (e.g., HbA1c or fasting plasma glucose) at next clinician appointment."
        else:
            tier_id = "higher"
            tier_name = "Higher Model-Estimated Risk"
            badge_color = "status-error"
            action_guidance = "Prioritize clinical evaluation, formal glycemic diagnostics, and structured lifestyle risk reduction intervention."

        return {
            "tier_id": tier_id,
            "tier_name": tier_name,
            "probability": round(probability, 4),
            "probability_percent": round(probability * 100, 1),
            "badge_color": badge_color,
            "action_guidance": action_guidance,
            "disclaimer": RESEARCH_DISCLAIMER
        }
