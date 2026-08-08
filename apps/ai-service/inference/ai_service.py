from pathlib import Path

from inference.predictor import Predictor

from explainability.explain import (
    explain_diabetes,
    explain_heart,
    explain_hypertension
)

from utils.triage import (
    get_risk_level,
    get_triage_action
)

from utils.clinical_risk import (
    calculate_clinical_risk
)

BASE_DIR = Path(__file__).resolve().parent.parent

# =====================================
# Load Models (Load Once)
# =====================================

diabetes_model = Predictor(
    BASE_DIR / "models" / "diabetes" / "diabetes_model.onnx"
)

heart_model = Predictor(
    BASE_DIR / "models" / "heart" / "heart_model.onnx"
)

hypertension_model = Predictor(
    BASE_DIR / "models" / "hypertension" / "hypertension_model.onnx"
)

# =====================================
# Diabetes Prediction
# =====================================

def predict_diabetes(patient):

    features = [
        patient["Pregnancies"],
        patient["Glucose"],
        patient["BloodPressure"],
        patient["SkinThickness"],
        patient["Insulin"],
        patient["BMI"],
        patient["DiabetesPedigreeFunction"],
        patient["Age"]
    ]

    result = diabetes_model.predict(features)

    # Risk Level
    risk = get_risk_level(
        result["probability"]
    )

    result["risk_level"] = risk

    # Triage
    result["triage"] = get_triage_action(
        risk
    )

    # Explainability
    result["reasons"] = explain_diabetes(
        patient
    )

    # Clinical Risk Engine
    clinical = calculate_clinical_risk(
        patient
    )

    result.update(clinical)

    return result


# =====================================
# Heart Disease Prediction
# =====================================

def predict_heart(patient):

    features = [
        patient["age"],
        patient["sex"],
        patient["cp"],
        patient["trestbps"],
        patient["chol"],
        patient["fbs"],
        patient["restecg"],
        patient["thalach"],
        patient["exang"],
        patient["oldpeak"],
        patient["slope"],
        patient["ca"],
        patient["thal"]
    ]

    result = heart_model.predict(features)

    # Risk Level
    risk = get_risk_level(
        result["probability"]
    )

    result["risk_level"] = risk

    # Triage
    result["triage"] = get_triage_action(
        risk
    )

    # Explainability
    result["reasons"] = explain_heart(
        patient
    )

    # Clinical Risk Engine
    clinical = calculate_clinical_risk(
        patient
    )

    result.update(clinical)

    return result


# =====================================
# Hypertension Prediction
# =====================================

def predict_hypertension(patient):

    features = [
        patient["Age"],
        patient["BMI"],
        patient["Systolic_BP"],
        patient["Diastolic_BP"],
        patient["Heart_Rate"],
        patient["BP_History"],
        patient["Medication"],
        patient["Family_History"],
        patient["Exercise_Level"],
        patient["Smoking_Status"]
    ]

    result = hypertension_model.predict(features)

    # Risk Level
    risk = get_risk_level(
        result["probability"]
    )

    result["risk_level"] = risk

    # Triage
    result["triage"] = get_triage_action(
        risk
    )

    # Explainability
    result["reasons"] = explain_hypertension(
        patient
    )

    # Clinical Risk Engine
    clinical = calculate_clinical_risk(
        patient
    )

    result.update(clinical)

    return result