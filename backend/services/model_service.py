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
import json
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
    deleted_any = False
    
    if os.path.isfile(path):
        os.remove(path)
        deleted_any = True
        
    # Clean up the metadata file (new standard)
    name_no_ext = filename.replace(".pkl", "")
    meta_path = os.path.join(MODELS_DIR, f"{name_no_ext}_metadata.json")
    if os.path.isfile(meta_path):
        os.remove(meta_path)
        deleted_any = True
        
    # Clean up the legacy metadata file if it exists
    meta_path_legacy = os.path.join(MODELS_DIR, f"{filename}_metadata.json")
    if os.path.isfile(meta_path_legacy):
        os.remove(meta_path_legacy)
        deleted_any = True

    return deleted_any


def get_model_metadata(filename: str) -> dict:
    # Primary: check for the new standard (without .pkl in name)
    name_no_ext = filename.replace(".pkl", "")
    meta_path = os.path.join(MODELS_DIR, f"{name_no_ext}_metadata.json")
    if os.path.isfile(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
            
    # Fallback: check for the legacy standard (with .pkl in name)
    meta_path_legacy = os.path.join(MODELS_DIR, f"{filename}_metadata.json")
    if os.path.isfile(meta_path_legacy):
        with open(meta_path_legacy, "r", encoding="utf-8") as f:
            return json.load(f)
            
    return {}


def predict(filename: str, features: dict | list) -> dict:
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

    if isinstance(features, dict):
        metadata = get_model_metadata(filename)
        if "features" in metadata:
            ordered_features = [features.get(f, 0.0) for f in metadata["features"]]
        else:
            ordered_features = list(features.values())
        X = np.array(ordered_features).reshape(1, -1)
    else:
        X = np.array(features).reshape(1, -1)
    prediction = model.predict(X)

    # probability scores if the model supports it
    proba = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0].tolist()

    pred_val = prediction[0]
    if hasattr(pred_val, "item"):
        pred_val = pred_val.item()

    return {
        "model":       filename,
        "prediction":  pred_val,
        "probability": proba
    }
