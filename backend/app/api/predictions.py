import io
import csv
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.ml.trainer import ModelTrainer
from app.stratification.risk_engine import RiskStratificationEngine
from app.config import RESEARCH_DISCLAIMER, FEATURE_METADATA

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

class SinglePredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: Optional[str] = None
    features: Dict[str, float]
    lower_threshold: float = 0.20
    upper_threshold: float = 0.50

@router.post("/single")
def predict_single(req: SinglePredictionRequest):
    try:
        bundle = ModelTrainer.get_model_bundle(req.model_id)
        model = bundle["estimator"]
        scaler = bundle["scaler"]
        feature_columns = bundle["feature_columns"]

        # Validate and construct input vector
        row = {}
        for f in feature_columns:
            if f in req.features:
                row[f] = float(req.features[f])
            else:
                row[f] = float(FEATURE_METADATA.get(f, {}).get("default", 0))

        df_input = pd.DataFrame([row], columns=feature_columns)
        
        # Scale
        if scaler:
            scaled_input = pd.DataFrame(scaler.transform(df_input), columns=feature_columns)
        else:
            scaled_input = df_input

        # Predict probability
        prob = float(model.predict_proba(scaled_input)[0, 1])

        # Assign risk tier
        tier_info = RiskStratificationEngine.assign_patient_risk_tier(
            prob,
            lower_threshold=req.lower_threshold,
            upper_threshold=req.upper_threshold
        )

        return {
            "model_id": bundle["model_id"],
            "model_type": bundle["model_type"],
            "estimated_probability": round(prob, 4),
            "estimated_percentage": round(prob * 100, 2),
            "risk_stratification": tier_info,
            "disclaimer": RESEARCH_DISCLAIMER
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch")
async def predict_batch(
    file: UploadFile = File(...),
    model_id: Optional[str] = Form(None),
    lower_threshold: float = Form(0.20),
    upper_threshold: float = Form(0.50)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        bundle = ModelTrainer.get_model_bundle(model_id)
        model = bundle["estimator"]
        scaler = bundle["scaler"]
        feature_columns = bundle["feature_columns"]

        total_rows = len(df)
        if total_rows > 25000:
            raise HTTPException(status_code=400, detail="Batch file exceeds limit of 25,000 rows.")

        # Check required columns
        missing_cols = [c for c in feature_columns if c not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded CSV is missing required features: {missing_cols[:5]}..."
            )

        X = df[feature_columns].copy()
        
        # Handle nulls
        null_count = int(X.isnull().sum().sum())
        X = X.fillna(X.median())

        if scaler:
            X_scaled = pd.DataFrame(scaler.transform(X), columns=feature_columns)
        else:
            X_scaled = X

        probs = model.predict_proba(X_scaled)[:, 1]
        
        # Stratify
        tiers = []
        for p in probs:
            if p < lower_threshold:
                tiers.append("Lower Risk")
            elif p < upper_threshold:
                tiers.append("Intermediate Risk")
            else:
                tiers.append("Higher Risk")

        results_df = df.copy()
        results_df["Predicted_Diabetes_Probability"] = np.round(probs, 4)
        results_df["Stratified_Risk_Tier"] = tiers

        tier_counts = pd.Series(tiers).value_counts().to_dict()

        # Preview of first 25 rows for UI display
        preview = results_df.head(25).to_dict(orient="records")

        return {
            "model_id": bundle["model_id"],
            "total_records": total_rows,
            "missing_values_imputed": null_count,
            "tier_summary": tier_counts,
            "preview": preview,
            "disclaimer": RESEARCH_DISCLAIMER
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
