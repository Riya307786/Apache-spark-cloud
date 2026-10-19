import json
import time
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

from app.config import (
    PROCESSED_DATA_DIR,
    FEATURE_METADATA,
    find_dataset_file
)
from app.services.dataset_loader import DatasetLoader

class PreprocessingPipeline:
    """
    Manages data preparation, validation, splitting, and scaling.
    Guarantees no data leakage: scalers are fit strictly on training data.
    """
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.target_column = "Diabetes_binary"
        self.metadata = {}

    def prepare_data(
        self,
        dataset_id: str = "binary",
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        remove_duplicates: bool = False,
        scale_features: bool = True
    ) -> Dict[str, Any]:
        """
        Executes stratified train/val/test split and fits transformation strictly on train.
        """
        assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-4, "Ratios must sum to 1.0"
        
        df = DatasetLoader.load_dataset(dataset_id).copy()
        target_col = "Diabetes_binary" if "Diabetes_binary" in df.columns else "Diabetes_012"
        self.target_column = target_col
        self.feature_columns = [c for c in df.columns if c != target_col]

        raw_rows = len(df)
        raw_duplicates = int(df.duplicated().sum())

        if remove_duplicates:
            df = df.drop_duplicates().reset_index(drop=True)
            duplicates_removed = raw_duplicates
        else:
            duplicates_removed = 0

        X = df[self.feature_columns].copy()
        y = df[target_col].copy()

        # Step 1: Split into train and temp (val + test)
        temp_ratio = val_ratio + test_ratio
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y,
            test_size=temp_ratio,
            random_state=self.random_state,
            stratify=y
        )

        # Step 2: Split temp into val and test
        val_relative_ratio = val_ratio / temp_ratio
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp,
            test_size=(1.0 - val_relative_ratio),
            random_state=self.random_state,
            stratify=y_temp
        )

        # Fit scaler ONLY on train set
        if scale_features:
            # Scale all continuous/ordinal columns
            self.scaler.fit(X_train)
            X_train_transformed = pd.DataFrame(self.scaler.transform(X_train), columns=self.feature_columns, index=X_train.index)
            X_val_transformed = pd.DataFrame(self.scaler.transform(X_val), columns=self.feature_columns, index=X_val.index)
            X_test_transformed = pd.DataFrame(self.scaler.transform(X_test), columns=self.feature_columns, index=X_test.index)
        else:
            X_train_transformed = X_train
            X_val_transformed = X_val
            X_test_transformed = X_test

        pipeline_id = f"prep_{dataset_id}_{int(time.time())}"
        
        # Save preprocessed splits
        split_dir = PROCESSED_DATA_DIR / pipeline_id
        split_dir.mkdir(parents=True, exist_ok=True)

        X_train_transformed.to_parquet(split_dir / "X_train.parquet")
        y_train.to_frame().to_parquet(split_dir / "y_train.parquet")
        X_val_transformed.to_parquet(split_dir / "X_val.parquet")
        y_val.to_frame().to_parquet(split_dir / "y_val.parquet")
        X_test_transformed.to_parquet(split_dir / "X_test.parquet")
        y_test.to_frame().to_parquet(split_dir / "y_test.parquet")

        # Also save raw untransformed test for SHAP feature interpretation
        X_test.to_parquet(split_dir / "X_test_raw.parquet")

        joblib.dump(self.scaler, split_dir / "scaler.joblib")

        self.metadata = {
            "pipeline_id": pipeline_id,
            "dataset_id": dataset_id,
            "target_column": target_col,
            "total_records": raw_rows,
            "processed_records": len(df),
            "duplicates_removed": duplicates_removed,
            "duplicate_policy": "Retained" if not remove_duplicates else "Filtered",
            "train_records": len(X_train),
            "val_records": len(X_val),
            "test_records": len(X_test),
            "feature_count": len(self.feature_columns),
            "features": self.feature_columns,
            "random_state": self.random_state,
            "scale_features": scale_features,
            "created_at": time.time(),
            "created_date": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "train_prevalence": round(float(y_train.mean()) * 100, 2),
            "val_prevalence": round(float(y_val.mean()) * 100, 2),
            "test_prevalence": round(float(y_test.mean()) * 100, 2)
        }

        with open(split_dir / "metadata.json", "w") as f:
            json.dump(self.metadata, f, indent=2)

        return {
            "pipeline_id": pipeline_id,
            "metadata": self.metadata,
            "X_train": X_train_transformed,
            "y_train": y_train,
            "X_val": X_val_transformed,
            "y_val": y_val,
            "X_test": X_test_transformed,
            "y_test": y_test,
            "X_test_raw": X_test
        }

    @classmethod
    def load_pipeline_splits(cls, pipeline_id: str) -> Dict[str, Any]:
        split_dir = PROCESSED_DATA_DIR / pipeline_id
        if not split_dir.exists():
            raise FileNotFoundError(f"Pipeline splits not found at {split_dir}")

        with open(split_dir / "metadata.json", "r") as f:
            metadata = json.load(f)

        X_train = pd.read_parquet(split_dir / "X_train.parquet")
        y_train = pd.read_parquet(split_dir / "y_train.parquet").squeeze()
        X_val = pd.read_parquet(split_dir / "X_val.parquet")
        y_val = pd.read_parquet(split_dir / "y_val.parquet").squeeze()
        X_test = pd.read_parquet(split_dir / "X_test.parquet")
        y_test = pd.read_parquet(split_dir / "y_test.parquet").squeeze()
        X_test_raw = pd.read_parquet(split_dir / "X_test_raw.parquet")
        scaler = joblib.load(split_dir / "scaler.joblib")

        return {
            "pipeline_id": pipeline_id,
            "metadata": metadata,
            "X_train": X_train,
            "y_train": y_train,
            "X_val": X_val,
            "y_val": y_val,
            "X_test": X_test,
            "y_test": y_test,
            "X_test_raw": X_test_raw,
            "scaler": scaler
        }
