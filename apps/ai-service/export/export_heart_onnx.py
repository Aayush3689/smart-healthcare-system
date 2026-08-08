from pathlib import Path
import joblib

from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR /
    "models" /
    "heart" /
    "heart_model.pkl"
)

ONNX_PATH = (
    BASE_DIR /
    "models" /
    "heart" /
    "heart_model.onnx"
)

print("Loading Heart Model...")

model = joblib.load(MODEL_PATH)

initial_type = [
    ("float_input", FloatTensorType([None, 13]))
]

onnx_model = convert_sklearn(
    model,
    initial_types=initial_type
)

with open(ONNX_PATH, "wb") as f:
    f.write(onnx_model.SerializeToString())

print("Heart ONNX Export Successful!")

print(ONNX_PATH)