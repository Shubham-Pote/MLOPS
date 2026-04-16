"""
test_api.py — pytest API tests (used by GitHub Actions CI)
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


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
