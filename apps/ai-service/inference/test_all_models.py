from inference.ai_service import (
    predict_diabetes,
    predict_heart,
    predict_hypertension
)

# ==========================
# Diabetes Test Patient
# ==========================

diabetes_patient = {
    "Pregnancies": 2,
    "Glucose": 138,
    "BloodPressure": 62,
    "SkinThickness": 35,
    "Insulin": 0,
    "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.127,
    "Age": 47
}

# ==========================
# Heart Disease Test Patient
# ==========================

heart_patient = {
    "age": 63,
    "sex": 1,
    "cp": 3,
    "trestbps": 145,
    "chol": 233,
    "fbs": 1,
    "restecg": 0,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 2.3,
    "slope": 0,
    "ca": 0,
    "thal": 1
}

# ==========================
# Hypertension Test Patient
# ==========================

hypertension_patient = {
    "Age": 45,
    "BMI": 28,
    "Systolic_BP": 130,
    "Diastolic_BP": 85,
    "Heart_Rate": 72,
    "BP_History": 0,
    "Medication": 1,
    "Family_History": 1,
    "Exercise_Level": 0,
    "Smoking_Status": 0
}

print("=" * 50)
print("DIABETES RESULT")
print("=" * 50)

print(
    predict_diabetes(diabetes_patient)
)

print("\n")

print("=" * 50)
print("HEART DISEASE RESULT")
print("=" * 50)

print(
    predict_heart(heart_patient)
)

print("\n")

print("=" * 50)
print("HYPERTENSION RESULT")
print("=" * 50)

print(
    predict_hypertension(hypertension_patient)
)