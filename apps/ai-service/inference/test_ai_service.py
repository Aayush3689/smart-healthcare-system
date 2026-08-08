from inference.ai_service import predict_diabetes
patient = {
    "Pregnancies": 2,
    "Glucose": 160,
    "BloodPressure": 95,
    "SkinThickness": 35,
    "Insulin": 0,
    "BMI": 34.5,
    "DiabetesPedigreeFunction": 0.5,
    "Age": 50
}

result = predict_diabetes(patient)

print("\nDiabetes Prediction Result:")
print(result)