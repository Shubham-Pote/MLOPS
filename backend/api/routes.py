from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from executor.docker_runner import run_code_in_docker
from services.model_service import list_models, model_exists, delete_model, predict
from services.mlflow_service import log_run, get_runs

router = APIRouter()


# ── Request / Response Models ─────────────────────────────────────────────────
class CodeRequest(BaseModel):
    code: str


class RunResponse(BaseModel):
    run_id: str
    status: str
    exit_code: int
    output: str
    data: Optional[Any]
    error: str
    model_saved: bool
    new_models: list[str]


class PredictRequest(BaseModel):
    model: str
    features: list[float]


# ── /run-code ─────────────────────────────────────────────────────────────────
@router.post("/run-code", response_model=RunResponse)
def run_code(request: CodeRequest):
    """
    Execute Python code inside a Docker container.
    - Models saved to models/ inside the container persist on the host.
    - If code prints a JSON object it is parsed and returned in `data`.
    - If `data` contains metrics/params they are auto-logged to MLflow.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")

    result = run_code_in_docker(request.code)

    # auto-log to MLflow if we got structured data
    if result["exit_code"] == 0 and isinstance(result["data"], dict):
        data = result["data"]
        metrics = {}
        params = {}

        for key in ("accuracy", "precision", "recall", "f1", "loss", "score"):
            if key in data:
                try:
                    metrics[key] = float(data[key])
                except (TypeError, ValueError):
                    pass

        for key in ("algorithm", "dataset", "model_path", "train_samples", "test_samples"):
            if key in data:
                params[key] = str(data[key])

        if metrics or params:
            try:
                log_run(
                    run_id=result["run_id"],
                    params=params,
                    metrics=metrics,
                    tags={"model_saved": str(result["model_saved"])}
                )
            except Exception:
                pass

    return RunResponse(
        run_id=result["run_id"],
        status="success" if result["exit_code"] == 0 else "error",
        exit_code=result["exit_code"],
        output=result["output"],
        data=result["data"],
        error=result["error"],
        model_saved=result["model_saved"],
        new_models=result["new_models"]
    )


# ── /models ───────────────────────────────────────────────────────────────────
@router.get("/models")
def get_models():
    """List all saved .pkl model files."""
    return {"count": len(list_models()), "models": list_models()}


@router.delete("/models/{filename}")
def delete_model_file(filename: str):
    """Delete a saved model by filename."""
    if not model_exists(filename):
        raise HTTPException(status_code=404, detail=f"Model '{filename}' not found.")
    delete_model(filename)
    return {"message": f"Model '{filename}' deleted."}


# ── /predict ──────────────────────────────────────────────────────────────────
@router.post("/predict")
def predict_endpoint(request: PredictRequest):
    """
    Load a saved .pkl model and return a prediction.

    Example:
        { "model": "iris_model.pkl", "features": [5.1, 3.5, 1.4, 0.2] }
    """
    if not model_exists(request.model):
        raise HTTPException(
            status_code=404,
            detail=f"Model '{request.model}' not found. Train and save it first via /run-code."
        )
    try:
        result = predict(request.model, request.features)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── /experiments ──────────────────────────────────────────────────────────────
@router.get("/experiments")
def get_experiments(limit: int = 20):
    """Return recent MLflow experiment runs."""
    try:
        runs = get_runs(max_results=limit)
        return {"count": len(runs), "runs": runs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── /health ───────────────────────────────────────────────────────────────────
@router.get("/health")
def health():
    return {"status": "ok"}
