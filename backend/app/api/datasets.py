from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.dataset_loader import DatasetLoader
from app.config import FEATURE_METADATA

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

@router.get("")
def list_datasets():
    return DatasetLoader.get_available_datasets()

@router.get("/{dataset_id}/summary")
def get_dataset_summary(dataset_id: str):
    try:
        return DatasetLoader.get_summary(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{dataset_id}/schema")
def get_dataset_schema(dataset_id: str):
    try:
        stats = DatasetLoader.get_feature_statistics(dataset_id)
        return {"dataset_id": dataset_id, "features": stats, "metadata": FEATURE_METADATA}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{dataset_id}/correlations")
def get_dataset_correlations(dataset_id: str, top_n: int = Query(12, ge=5, le=21)):
    try:
        return DatasetLoader.get_correlations(dataset_id, top_n=top_n)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{dataset_id}/samples")
def get_dataset_samples(dataset_id: str, offset: int = Query(0, ge=0), limit: int = Query(25, ge=1, le=100)):
    try:
        return DatasetLoader.get_sample_rows(dataset_id, offset=offset, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{dataset_id}/distribution")
def get_dataset_distribution(dataset_id: str, column: str = Query("BMI")):
    try:
        return DatasetLoader.get_distribution_data(dataset_id, column=column)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
