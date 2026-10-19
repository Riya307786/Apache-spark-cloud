from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.explainability.shap_explainer import ShapExplainerService

router = APIRouter(prefix="/api/explanations", tags=["Explainability"])

class LocalExplanationRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: Optional[str] = None
    features: Dict[str, Any]

@router.post("/global")
def get_global_explanations(
    model_id: Optional[str] = None,
    sample_size: int = Query(150, ge=50, le=500)
):
    try:
        return ShapExplainerService.get_global_explanations(model_id=model_id, sample_size=sample_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/local")
def get_local_explanation(req: LocalExplanationRequest):
    try:
        return ShapExplainerService.get_local_explanation(
            patient_features=req.features,
            model_id=req.model_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
