"""
mlflow_service.py
─────────────────
Handles MLflow experiment tracking:
  - log parameters, metrics, and model info per run
  - retrieve past experiment runs
"""
import os
import mlflow

# Store experiments inside the experiments/ folder at project root
EXPERIMENTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "experiments")
)
os.makedirs(EXPERIMENTS_DIR, exist_ok=True)

MLFLOW_TRACKING_URI = f"file:///{EXPERIMENTS_DIR.replace(os.sep, '/')}"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

EXPERIMENT_NAME = "mlops-platform"

# Create experiment if it doesn't exist
if not mlflow.get_experiment_by_name(EXPERIMENT_NAME):
    mlflow.create_experiment(EXPERIMENT_NAME)


def log_run(run_id: str, params: dict, metrics: dict, tags: dict = None) -> str:
    """
    Log a training run to MLflow.

    Args:
        run_id  : unique run id (from docker_runner)
        params  : e.g. {"algorithm": "LogisticRegression", "dataset": "iris"}
        metrics : e.g. {"accuracy": 0.97}
        tags    : optional metadata

    Returns:
        mlflow_run_id (str)
    """
    mlflow.set_experiment(EXPERIMENT_NAME)

    algorithm = params.get("algorithm", "") if params else ""
    dataset = params.get("dataset", "") if params else ""
    
    if algorithm and dataset:
        friendly_name = f"{algorithm} - {dataset}"
    elif algorithm:
        friendly_name = f"{algorithm} Run"
    else:
        friendly_name = f"Experiment Run {run_id[:6]}"

    with mlflow.start_run(run_name=friendly_name) as run:
        if params:
            mlflow.log_params(params)
        if metrics:
            mlflow.log_metrics(metrics)
        if tags:
            mlflow.set_tags(tags)
        return run.info.run_id


import pandas as pd

def get_runs(max_results: int = 20) -> list[dict]:
    """Return recent experiment runs as a list of dicts."""
    experiment = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
    if not experiment:
        return []

    runs = mlflow.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["start_time DESC"],
        max_results=max_results,
    )

    results = []
    for _, row in runs.iterrows():
        results.append({
            "run_id":     row.get("run_id", ""),
            "run_name":   row.get("tags.mlflow.runName", ""),
            "status":     row.get("status", ""),
            "start_time": str(row.get("start_time", "")),
            "metrics":    {
                k.replace("metrics.", ""): v
                for k, v in row.items()
                if k.startswith("metrics.") and pd.notna(v)
            },
            "params":     {
                k.replace("params.", ""): v
                for k, v in row.items()
                if k.startswith("params.") and pd.notna(v)
            },
        })
    return results
