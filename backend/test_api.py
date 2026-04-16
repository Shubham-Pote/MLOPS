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
TEST_MODEL  = "test_iris_model.pkl"


# ── Fixture: create a real model before predict tests, clean up after ─────────
@pytest.fixture(scope="session", autouse=True)
def seed_test_model():
    """Train and save a test model so /predict tests work in CI."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    X, y = load_iris(return_X_y=True)
    model = LogisticRegression(max_iter=200)
    model.fit(X, y)
    joblib.dump(model, os.path.join(MODELS_DIR, TEST_MODEL))
    yield
    # cleanup
    path = os.path.join(MODELS_DIR, TEST_MODEL)
    if os.path.exists(path):
        os.remove(path)


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


def test_predict_missing_model():
    response = client.post("/predict", json={
        "model": "nonexistent_model.pkl",
        "features": [5.1, 3.5, 1.4, 0.2]
    })
    assert response.status_code == 404


def test_predict():
    response = client.post("/predict", json={
        "model": TEST_MODEL,
        "features": [5.1, 3.5, 1.4, 0.2]
    })
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert "prediction" in body
    assert "probability" in body
    assert isinstance(body["prediction"], int)
    assert len(body["probability"]) == 3   # 3 iris classes
