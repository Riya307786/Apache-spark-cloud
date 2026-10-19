import pytest
from app.services.dataset_loader import DatasetLoader
from app.ml.pipeline import PreprocessingPipeline
from app.ml.trainer import ModelTrainer
from app.stratification.risk_engine import RiskStratificationEngine
from app.explainability.shap_explainer import ShapExplainerService

def test_dataset_loader():
    datasets = DatasetLoader.get_available_datasets()
    assert len(datasets) >= 3
    binary_ds = next(d for d in datasets if d["id"] == "binary")
    assert binary_ds["exists"] is True

    summary = DatasetLoader.get_summary("binary")
    assert summary["total_rows"] == 253680
    assert summary["target_column"] == "Diabetes_binary"
    assert "0" in summary["target_distribution"]
    assert "1" in summary["target_distribution"]

def test_preprocessing_pipeline():
    prep = PreprocessingPipeline(random_state=42)
    res = prep.prepare_data(
        dataset_id="binary",
        train_ratio=0.7,
        val_ratio=0.15,
        test_ratio=0.15
    )
    assert res["X_train"].shape[1] == 21
    assert len(res["X_train"]) > 170000
    assert len(res["X_test"]) > 35000

def test_model_training_and_explainability():
    # Train a fast Logistic Regression model for verification
    result = ModelTrainer.train_model(
        model_type="logistic_regression",
        dataset_id="binary",
        hyperparameters={"max_iter": 200, "random_state": 42}
    )
    assert result["model_id"] is not None
    assert result["test_metrics"]["roc_auc"] > 0.70

    # Test Stratification
    strat = RiskStratificationEngine.evaluate_stratification(model_id=result["model_id"])
    assert len(strat["tiers"]) == 3
    assert strat["tiers"][0]["id"] == "lower"

    # Test SHAP global
    global_shap = ShapExplainerService.get_global_explanations(model_id=result["model_id"], sample_size=50)
    assert len(global_shap["global_importance"]) == 21

    # Test SHAP local
    local_shap = ShapExplainerService.get_local_explanation(
        patient_features={"HighBP": 1.0, "HighChol": 1.0, "BMI": 32.0, "GenHlth": 4.0},
        model_id=result["model_id"]
    )
    assert "estimated_probability" in local_shap
    assert len(local_shap["all_contributions"]) == 21
