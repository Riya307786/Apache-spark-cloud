from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from app.stratification.risk_engine import RiskStratificationEngine

router = APIRouter(prefix="/api/stratification", tags=["Risk Stratification"])

class StratificationEvalRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: Optional[str] = None
    lower_threshold: float = Field(0.20, ge=0.05, le=0.45)
    upper_threshold: float = Field(0.50, ge=0.30, le=0.85)

@router.get("/summary")
def get_stratification_summary(
    model_id: Optional[str] = None,
    lower_threshold: float = Query(0.20, ge=0.05, le=0.45),
    upper_threshold: float = Query(0.50, ge=0.30, le=0.85)
):
    try:
        return RiskStratificationEngine.evaluate_stratification(
            model_id=model_id,
            lower_threshold=lower_threshold,
            upper_threshold=upper_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
def evaluate_stratification(req: StratificationEvalRequest):
    if req.lower_threshold >= req.upper_threshold:
        raise HTTPException(status_code=400, detail="Lower threshold must be strictly less than upper threshold.")

    try:
        return RiskStratificationEngine.evaluate_stratification(
            model_id=req.model_id,
            lower_threshold=req.lower_threshold,
            upper_threshold=req.upper_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
