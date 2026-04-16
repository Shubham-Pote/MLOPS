"""
model_service.py
────────────────
Handles everything related to saved .pkl models:
  - list all models
  - get metadata for a specific model
  - delete a model
  - load model and run predictions
"""
import os
import glob
import time
import joblib

MODELS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "models")
)
os.makedirs(MODELS_DIR, exist_ok=True)


def list_models() -> list[dict]:
    """Return metadata for every .pkl file in models/."""
    models = []
    for path in glob.glob(os.path.join(MODELS_DIR, "*.pkl")):
        stat = os.stat(path)
        models.append({
            "filename":   os.path.basename(path),
            "path":       f"models/{os.path.basename(path)}",
            "size_kb":    round(stat.st_size / 1024, 2),
            "created_at": time.strftime(
                "%Y-%m-%d %H:%M:%S", time.localtime(stat.st_ctime)
            )
        })
    models.sort(key=lambda m: m["created_at"], reverse=True)
    return models


def model_exists(filename: str) -> bool:
    return os.path.isfile(os.path.join(MODELS_DIR, filename))


def get_model_path(filename: str) -> str:
    return os.path.join(MODELS_DIR, filename)


def delete_model(filename: str) -> bool:
    path = os.path.join(MODELS_DIR, filename)
    if os.path.isfile(path):
        os.remove(path)
        return True
    return False


def predict(filename: str, features: list) -> dict:
    """
    Load a saved .pkl model and run inference.

    Args:
        filename : e.g. "iris_model.pkl"
        features : flat list of feature values, e.g. [5.1, 3.5, 1.4, 0.2]

    Returns:
        { "prediction": int/float/str, "model": filename }
    """
    path = get_model_path(filename)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Model '{filename}' not found in models/")

    model = joblib.load(path)

    import numpy as np
    X = np.array(features).reshape(1, -1)
    prediction = model.predict(X)

    # probability scores if the model supports it
    proba = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0].tolist()

    return {
        "model":       filename,
        "prediction":  int(prediction[0]),
        "probability": proba
    }
