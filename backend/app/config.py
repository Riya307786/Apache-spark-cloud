import os
from pathlib import Path
from typing import Dict, Any, List

def resolve_project_root() -> Path:
    """
    Resolve the project root reliably from any working directory
    by searching parent directories for the 'dataset' directory.
    """
    current = Path(__file__).resolve().parent
    for _ in range(5):
        if (current / "dataset").exists() or (current / "backend").exists():
            return current
        current = current.parent
    return Path(__file__).resolve().parents[2]

PROJECT_ROOT = resolve_project_root()
DATASET_DIR = PROJECT_ROOT / "dataset"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
PROCESSED_DATA_DIR = PROJECT_ROOT / "processed_data"
EXPERIMENTS_DIR = PROJECT_ROOT / "experiments"
REPORTS_DIR = PROJECT_ROOT / "reports"

# Ensure runtime directories exist
for directory in [ARTIFACTS_DIR, PROCESSED_DATA_DIR, EXPERIMENTS_DIR, REPORTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Dataset filenames
DATASET_FILES = {
    "binary": "diabetes_binary_health_indicators_BRFSS2015.csv",
    "multi_class": "diabetes_012_health_indicators_BRFSS2015.csv",
    "balanced_binary": "diabetes_binary_5050split_health_indicators_BRFSS2015.csv"
}

def find_dataset_file(filename: str) -> Path:
    """
    Searches for a dataset file in DATASET_DIR, then DATASET_DIR / 'archive (6)',
    or anywhere recursively inside DATASET_DIR.
    """
    direct = DATASET_DIR / filename
    if direct.exists():
        return direct
    
    archive = DATASET_DIR / "archive (6)" / filename
    if archive.exists():
        return archive
        
    for p in DATASET_DIR.rglob(filename):
        if p.exists():
            return p
            
    raise FileNotFoundError(
        f"Dataset file '{filename}' was not found in '{DATASET_DIR}'. "
        f"Expected path: {direct}"
    )

FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    "HighBP": {
        "label": "High Blood Pressure",
        "description": "Adults who have been told they have high blood pressure by a doctor, nurse, or other health professional.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "HighChol": {
        "label": "High Cholesterol",
        "description": "Adults who have had their cholesterol checked and told it is high.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "CholCheck": {
        "label": "Cholesterol Check (Past 5 Years)",
        "description": "Cholesterol check within the past five years.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 1
    },
    "BMI": {
        "label": "Body Mass Index (BMI)",
        "description": "Body Mass Index calculated as weight (kg) / [height (m)]^2.",
        "type": "numeric",
        "min": 12,
        "max": 98,
        "default": 27.0
    },
    "Smoker": {
        "label": "Smoker (100+ Cigarettes)",
        "description": "Have you smoked at least 100 cigarettes in your entire life? [Note: 5 packs = 100 cigarettes]",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "Stroke": {
        "label": "History of Stroke",
        "description": "(Ever told) you had a stroke.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "HeartDiseaseorAttack": {
        "label": "Coronary Heart Disease or Myocardial Infarction",
        "description": "Respondents that have ever reported having coronary heart disease (CHD) or myocardial infarction (MI).",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "PhysActivity": {
        "label": "Physical Activity (Past 30 Days)",
        "description": "Physical activity or exercise during the past 30 days other than their regular job.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 1
    },
    "Fruits": {
        "label": "Consumes Fruit Daily",
        "description": "Consume Fruit 1 or more times per day.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 1
    },
    "Veggies": {
        "label": "Consumes Vegetables Daily",
        "description": "Consume Vegetables 1 or more times per day.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 1
    },
    "HvyAlcoholConsump": {
        "label": "Heavy Alcohol Consumption",
        "description": "Adult men having more than 14 drinks per week and adult women having more than 7 drinks per week.",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "AnyHealthcare": {
        "label": "Health Care Coverage",
        "description": "Do you have any kind of health care coverage, including health insurance, prepaid plans such as HMOs, or government plans such as Medicare?",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 1
    },
    "NoDocbcCost": {
        "label": "Could Not Afford Doctor",
        "description": "Was there a time in the past 12 months when you needed to see a doctor but could not because of cost?",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "GenHlth": {
        "label": "General Health Self-Rating",
        "description": "Would you say that in general your health is: (1: Excellent to 5: Poor)",
        "type": "ordinal",
        "options": [
            {"value": 1, "label": "1 - Excellent"},
            {"value": 2, "label": "2 - Very Good"},
            {"value": 3, "label": "3 - Good"},
            {"value": 4, "label": "4 - Fair"},
            {"value": 5, "label": "5 - Poor"}
        ],
        "default": 2
    },
    "MentHlth": {
        "label": "Poor Mental Health Days (0-30)",
        "description": "Now thinking about your mental health, which includes stress, depression, and problems with emotions, for how many days during the past 30 days was your mental health not good?",
        "type": "numeric",
        "min": 0,
        "max": 30,
        "default": 0
    },
    "PhysHlth": {
        "label": "Poor Physical Health Days (0-30)",
        "description": "Now thinking about your physical health, which includes physical illness and injury, for how many days during the past 30 days was your physical health not good?",
        "type": "numeric",
        "min": 0,
        "max": 30,
        "default": 0
    },
    "DiffWalk": {
        "label": "Difficulty Walking / Climbing Stairs",
        "description": "Do you have serious difficulty walking or climbing stairs?",
        "type": "binary",
        "options": [{"value": 0, "label": "No"}, {"value": 1, "label": "Yes"}],
        "default": 0
    },
    "Sex": {
        "label": "Biological Sex",
        "description": "Indicates respondent's biological sex.",
        "type": "categorical",
        "options": [{"value": 0, "label": "Female"}, {"value": 1, "label": "Male"}],
        "default": 0
    },
    "Age": {
        "label": "Age Bracket (13 categories)",
        "description": "Thirteen-level age category (BRFSS encoding). Note: Survey category, not continuous age in years.",
        "type": "ordinal",
        "options": [
            {"value": 1, "label": "18 to 24"},
            {"value": 2, "label": "25 to 29"},
            {"value": 3, "label": "30 to 34"},
            {"value": 4, "label": "35 to 39"},
            {"value": 5, "label": "40 to 44"},
            {"value": 6, "label": "45 to 49"},
            {"value": 7, "label": "50 to 54"},
            {"value": 8, "label": "55 to 59"},
            {"value": 9, "label": "60 to 64"},
            {"value": 10, "label": "65 to 69"},
            {"value": 11, "label": "70 to 74"},
            {"value": 12, "label": "75 to 79"},
            {"value": 13, "label": "80 or older"}
        ],
        "default": 7
    },
    "Education": {
        "label": "Education Level (1-6)",
        "description": "Education level completed (1: Never attended / Kindergarten to 6: 4+ years of college).",
        "type": "ordinal",
        "options": [
            {"value": 1, "label": "Never attended school or kindergarten"},
            {"value": 2, "label": "Grades 1 through 8 (Elementary)"},
            {"value": 3, "label": "Grades 9 through 11 (Some high school)"},
            {"value": 4, "label": "Grade 12 or GED (High school graduate)"},
            {"value": 5, "label": "College 1 to 3 years (Some college/tech school)"},
            {"value": 6, "label": "College 4+ years (College graduate)"}
        ],
        "default": 5
    },
    "Income": {
        "label": "Income Bracket (1-8)",
        "description": "Household income category from all sources.",
        "type": "ordinal",
        "options": [
            {"value": 1, "label": "Less than $10,000"},
            {"value": 2, "label": "$10,000 to < $15,000"},
            {"value": 3, "label": "$15,000 to < $20,000"},
            {"value": 4, "label": "$20,000 to < $25,000"},
            {"value": 5, "label": "$25,000 to < $35,000"},
            {"value": 6, "label": "$35,000 to < $50,000"},
            {"value": 7, "label": "$50,000 to < $75,000"},
            {"value": 8, "label": "$75,000 or more"}
        ],
        "default": 6
    }
}

RESEARCH_DISCLAIMER = (
    "Research estimate only. This model does not provide a medical diagnosis. "
    "Results may be inaccurate and should not replace professional medical "
    "assessment or appropriate clinical testing."
)
