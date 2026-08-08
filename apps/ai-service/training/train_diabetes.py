from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from preprocessing.preprocess import (
    load_data,
    clean_data,
    split_features,
)

from utils.trainer import train_model

DATASET = BASE_DIR / "datasets" / "diabetes.csv"

MODEL_DIR = BASE_DIR / "models" / "diabetes"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODEL_DIR / "diabetes_model.pkl"

print("Loading Diabetes Dataset...")

df = load_data(DATASET)
df = clean_data(df)

X, y = split_features(df, "Outcome")

print(f"Dataset Shape: {df.shape}")

train_model(X, y, MODEL_PATH)

print("\nDiabetes Model Trained Successfully!")