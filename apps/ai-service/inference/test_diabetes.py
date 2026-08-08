from pathlib import Path
import numpy as np
import onnxruntime as ort

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR /
    "models" /
    "diabetes" /
    "diabetes_model.onnx"
)

session = ort.InferenceSession(str(MODEL_PATH))

print("Model Loaded Successfully!")

print("Input Name :", session.get_inputs()[0].name)
print("Output Name:", session.get_outputs()[0].name)

sample = np.array([
    [
        2,      # Pregnancies
        138,    # Glucose
        62,     # BloodPressure
        35,     # SkinThickness
        0,      # Insulin
        33.6,   # BMI
        0.127,  # DiabetesPedigreeFunction
        47      # Age
    ]
], dtype=np.float32)

input_name = session.get_inputs()[0].name

prediction = session.run(
    None,
    {
        input_name: sample
    }
)

print("\nPrediction:")
print(prediction)