import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.config import (
    DATASET_FILES,
    find_dataset_file,
    FEATURE_METADATA,
    PROJECT_ROOT
)

class DatasetLoader:
    """
    Manages loading, caching, and analyzing the BRFSS 2015 diabetes datasets.
    Reads directly from the project's dataset directory.
    """
    _cache: Dict[str, pd.DataFrame] = {}
    _summary_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_available_datasets(cls) -> List[Dict[str, Any]]:
        datasets = []
        for key, filename in DATASET_FILES.items():
            try:
                path = find_dataset_file(filename)
                file_size_mb = round(path.stat().st_size / (1024 * 1024), 2)
                datasets.append({
                    "id": key,
                    "filename": filename,
                    "exists": True,
                    "path": str(path.relative_to(PROJECT_ROOT)),
                    "size_mb": file_size_mb,
                    "description": (
                        "Primary binary classification dataset (CDC BRFSS 2015)"
                        if key == "binary"
                        else "3-class dataset: 0=no diabetes, 1=prediabetes, 2=diabetes"
                        if key == "multi_class"
                        else "Balanced 50/50 binary subset for sensitivity analysis"
                    ),
                    "role": (
                        "Primary Research Dataset"
                        if key == "binary"
                        else "Multi-class Progression Experiment"
                        if key == "multi_class"
                        else "Class Balance Sensitivity Check"
                    )
                })
            except FileNotFoundError:
                datasets.append({
                    "id": key,
                    "filename": filename,
                    "exists": False,
                    "path": f"dataset/{filename}",
                    "size_mb": 0.0,
                    "description": "File not found",
                    "role": "Unavailable"
                })
        return datasets

    @classmethod
    def load_dataset(cls, dataset_id: str = "binary", force_reload: bool = False) -> pd.DataFrame:
        if dataset_id not in DATASET_FILES:
            raise ValueError(f"Unknown dataset_id '{dataset_id}'. Must be one of: {list(DATASET_FILES.keys())}")
            
        if not force_reload and dataset_id in cls._cache:
            return cls._cache[dataset_id]

        filename = DATASET_FILES[dataset_id]
        filepath = find_dataset_file(filename)
        
        # Load CSV using project-relative resolution
        df = pd.read_csv(filepath)
        cls._cache[dataset_id] = df
        return df

    @classmethod
    def get_summary(cls, dataset_id: str = "binary") -> Dict[str, Any]:
        if dataset_id in cls._summary_cache:
            return cls._summary_cache[dataset_id]

        df = cls.load_dataset(dataset_id)
        target_col = "Diabetes_binary" if "Diabetes_binary" in df.columns else "Diabetes_012"
        
        target_counts = df[target_col].value_counts().to_dict()
        target_distribution = {
            str(int(k) if isinstance(k, (int, float)) and not np.isnan(k) else k): int(v)
            for k, v in target_counts.items()
        }

        # Calculate exact duplicates
        duplicate_rows = int(df.duplicated().sum())
        missing_values = int(df.isnull().sum().sum())
        total_rows = int(len(df))
        total_cols = int(df.shape[1])
        feature_cols = [c for c in df.columns if c != target_col]

        # Class ratio
        if target_col == "Diabetes_binary":
            neg_count = target_distribution.get("0", 0)
            pos_count = target_distribution.get("1", 0)
            imbalance_ratio = round(neg_count / max(pos_count, 1), 2)
            prevalence = round((pos_count / max(total_rows, 1)) * 100, 2)
        else:
            imbalance_ratio = 1.0
            prevalence = 0.0

        summary = {
            "dataset_id": dataset_id,
            "filename": DATASET_FILES.get(dataset_id),
            "total_rows": total_rows,
            "total_cols": total_cols,
            "feature_count": len(feature_cols),
            "target_column": target_col,
            "target_distribution": target_distribution,
            "imbalance_ratio": f"{imbalance_ratio}:1" if target_col == "Diabetes_binary" else "Multi-class",
            "prevalence_percent": prevalence,
            "missing_values": missing_values,
            "duplicate_rows": duplicate_rows,
            "duplicate_percentage": round((duplicate_rows / max(total_rows, 1)) * 100, 2),
            "duplicate_policy_note": (
                "BRFSS survey records contain 21 discrete integer-encoded features. "
                "Identical combinations represent distinct respondents who provided "
                "the same survey answers, not data collection errors. Rows are retained."
            ),
            "features": feature_cols
        }

        cls._summary_cache[dataset_id] = summary
        return summary

    @classmethod
    def get_feature_statistics(cls, dataset_id: str = "binary") -> List[Dict[str, Any]]:
        df = cls.load_dataset(dataset_id)
        target_col = "Diabetes_binary" if "Diabetes_binary" in df.columns else "Diabetes_012"
        stats = []

        for col in df.columns:
            series = df[col]
            meta = FEATURE_METADATA.get(col, {})
            val_counts = series.value_counts(normalize=True).head(5).to_dict()
            top_vals = [
                {"value": float(k), "percentage": round(float(v) * 100, 2)}
                for k, v in val_counts.items()
            ]

            stats.append({
                "column": col,
                "label": meta.get("label", col),
                "is_target": col == target_col,
                "data_type": str(series.dtype),
                "unique_values": int(series.nunique()),
                "missing": int(series.isnull().sum()),
                "mean": round(float(series.mean()), 3),
                "std": round(float(series.std()), 3),
                "min": float(series.min()),
                "q25": float(series.quantile(0.25)),
                "median": float(series.median()),
                "q75": float(series.quantile(0.75)),
                "max": float(series.max()),
                "top_values": top_vals,
                "description": meta.get("description", "Feature indicator from BRFSS survey")
            })

        return stats

    @classmethod
    def get_correlations(cls, dataset_id: str = "binary", top_n: int = 15) -> Dict[str, Any]:
        df = cls.load_dataset(dataset_id)
        target_col = "Diabetes_binary" if "Diabetes_binary" in df.columns else "Diabetes_012"
        
        corr_matrix = df.corr()
        
        # Target correlations sorted
        target_corr = corr_matrix[target_col].drop(target_col).sort_values(ascending=False)
        target_correlations = [
            {
                "feature": k,
                "label": FEATURE_METADATA.get(k, {}).get("label", k),
                "correlation": round(float(v), 4),
                "abs_correlation": round(abs(float(v)), 4)
            }
            for k, v in target_corr.items()
        ]

        # Top features for heatmap
        top_features = [item["feature"] for item in target_correlations[:top_n]]
        heatmap_features = [target_col] + top_features
        sub_matrix = corr_matrix.loc[heatmap_features, heatmap_features]
        
        matrix_data = []
        for row_col in heatmap_features:
            row_dict = {"feature": row_col}
            for col_col in heatmap_features:
                row_dict[col_col] = round(float(sub_matrix.loc[row_col, col_col]), 3)
            matrix_data.append(row_dict)

        return {
            "target_column": target_col,
            "target_correlations": target_correlations,
            "heatmap_features": heatmap_features,
            "heatmap_matrix": matrix_data
        }

    @classmethod
    def get_sample_rows(cls, dataset_id: str = "binary", offset: int = 0, limit: int = 25) -> Dict[str, Any]:
        df = cls.load_dataset(dataset_id)
        total_rows = len(df)
        limit = min(limit, 100) # Safety upper bound
        slice_df = df.iloc[offset : offset + limit]
        
        return {
            "total_rows": total_rows,
            "offset": offset,
            "limit": limit,
            "columns": list(df.columns),
            "rows": slice_df.to_dict(orient="records")
        }

    @classmethod
    def get_distribution_data(cls, dataset_id: str = "binary", column: str = "BMI") -> Dict[str, Any]:
        df = cls.load_dataset(dataset_id)
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")

        series = df[column]
        target_col = "Diabetes_binary" if "Diabetes_binary" in df.columns else "Diabetes_012"

        # If numeric continuous like BMI, MentHlth, PhysHlth, use histogram bins
        if series.nunique() > 15:
            counts, bin_edges = np.histogram(series.dropna(), bins=15)
            bins_data = []
            for i in range(len(counts)):
                label = f"{round(bin_edges[i], 1)}-{round(bin_edges[i+1], 1)}"
                mask = (series >= bin_edges[i]) & (series < bin_edges[i+1] if i < len(counts)-1 else series <= bin_edges[i+1])
                target_pos_rate = round(float(df.loc[mask, target_col].mean()) * 100, 2) if mask.sum() > 0 else 0.0
                bins_data.append({
                    "range": label,
                    "count": int(counts[i]),
                    "diabetes_rate": target_pos_rate
                })
            return {"column": column, "type": "binned", "bins": bins_data}
        else:
            # Discrete / Ordinal
            grouped = df.groupby(column)[target_col].agg(["count", "mean"]).reset_index()
            meta = FEATURE_METADATA.get(column, {})
            options_map = {opt["value"]: opt["label"] for opt in meta.get("options", [])}
            
            categories_data = []
            for _, row in grouped.iterrows():
                val = int(row[column])
                label = options_map.get(val, str(val))
                categories_data.append({
                    "category": label,
                    "value": val,
                    "count": int(row["count"]),
                    "diabetes_rate": round(float(row["mean"]) * 100, 2)
                })
            return {"column": column, "type": "categorical", "categories": categories_data}
