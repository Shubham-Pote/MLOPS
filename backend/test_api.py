"""
test_api.py — pytest API tests (used by GitHub Actions CI)
"""
import os
import pytest
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
TEST_MODEL = "test_iris_model.pkl"


# ── Fixture: create a real model before predict tests, clean up after ─────────
@pytest.fixture(scope="session", autouse=True)
def seed_test_model():
    """Train and save a test model so /predict tests work in CI."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    X, y = load_iris(return_X_y=True)
    model = LogisticRegression(max_iter=200)
    model.fit(X, y)
    joblib.dump(model, os.path.join(MODELS_DIR, TEST_MODEL))
    import json
    metadata = {
        "model_name": TEST_MODEL,
        "features": ["sepal_length", "sepal_width", "petal_length", "petal_width"],
        "target": "species"
    }
    with open(os.path.join(MODELS_DIR, f"{TEST_MODEL.replace('.pkl', '')}_metadata.json"), "w") as mf:
        json.dump(metadata, mf)

    yield
    # cleanup
    path = os.path.join(MODELS_DIR, TEST_MODEL)
    meta_path = os.path.join(MODELS_DIR, f"{TEST_MODEL.replace('.pkl', '')}_metadata.json")
    if os.path.exists(path):
        os.remove(path)
    if os.path.exists(meta_path):
        os.remove(meta_path)


# ── Tests ─────────────────────────────────────────────────────────────────────
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "MLOps" in response.json()["message"]


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_run_code_empty_rejected():
    response = client.post("/run-code", json={"code": ""})
    assert response.status_code == 400


def test_models_list():
    response = client.get("/models")
    assert response.status_code == 200
    assert "models" in response.json()
    assert "count" in response.json()


def test_metrics():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "predict_requests_total" in response.text


def test_predict_missing_model():
    response = client.post("/predict", json={
        "model": "nonexistent_model.pkl",
        "features": [5.1, 3.5, 1.4, 0.2]
    })
    assert response.status_code == 404


def test_predict():
    # Test backwards compatibility (list of floats)
    response_list = client.post("/predict", json={
        "model": TEST_MODEL,
        "features": [5.1, 3.5, 1.4, 0.2]
    })
    assert response_list.status_code == 200

    # Test dictionary of features, respecting metadata mapping
    response_dict = client.post("/predict", json={
        "model": TEST_MODEL,
        "features": {
            "sepal_length": 5.1,
            "sepal_width": 3.5,
            "petal_length": 1.4,
            "petal_width": 0.2
        }
    })
    assert response_dict.status_code == 200
    body = response_dict.json()
    assert body["status"] == "success"
    assert "prediction" in body
    assert "probability" in body
    assert isinstance(body["prediction"], int)
    assert len(body["probability"]) == 3   # 3 iris classes


def test_model_info():
    response = client.get(f"/model-info/{TEST_MODEL}")
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert "sepal_length" in data["features"]

    # Test passing short name (without .pkl)
    short_name = TEST_MODEL.replace('.pkl', '')
    response_short = client.get(f"/model-info/{short_name}")
    assert response_short.status_code == 200
