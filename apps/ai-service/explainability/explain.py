def explain_diabetes(data):
    reasons = []

    if data["Glucose"] > 140:
        reasons.append("High Glucose")

    if data["BMI"] > 30:
        reasons.append("High BMI")

    if data["Age"] > 45:
        reasons.append("Age Above 45")

    if data["BloodPressure"] > 90:
        reasons.append("High Blood Pressure")

    return reasons


def explain_heart(data):

    reasons = []

    if data["age"] > 50:
        reasons.append("Age Above 50")

    if data["chol"] > 240:
        reasons.append("High Cholesterol")

    if data["trestbps"] > 140:
        reasons.append("High Resting Blood Pressure")

    if data["exang"] == 1:
        reasons.append("Exercise Induced Angina")

    if data["oldpeak"] > 2:
        reasons.append("Abnormal ECG Stress Result")

    return reasons

def explain_hypertension(data):

    reasons = []

    if data["Systolic_BP"] > 140:
        reasons.append("High Systolic Blood Pressure")

    if data["Diastolic_BP"] > 90:
        reasons.append("High Diastolic Blood Pressure")

    if data["BMI"] > 30:
        reasons.append("Obesity Risk")

    if data["Family_History"] == 1:
        reasons.append("Family History Of Hypertension")

    if data["Smoking_Status"] == 1:
        reasons.append("Smoking Risk")

    if data["Exercise_Level"] == 0:
        reasons.append("Low Physical Activity")

    return reasons