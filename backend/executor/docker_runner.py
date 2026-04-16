import subprocess
import tempfile
import os
import uuid
import shutil
import json


DOCKER_IMAGE = "mlops-runner"
MEMORY_LIMIT = "150m"
CPU_LIMIT = "0.5"
TIMEOUT_SEC = 60

MODELS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "models")
)
os.makedirs(MODELS_DIR, exist_ok=True)


def run_code_in_docker(code: str, run_id: str = None) -> dict:
    """
    Executes `code` inside an isolated Docker container.

    Returns:
    {
        "run_id":    str,
        "output":    str,
        "data":      dict | None,
        "error":     str,
        "exit_code": int,
        "model_saved": bool,
        "new_models":  list
    }
    """
    if not run_id:
        run_id = uuid.uuid4().hex[:12]

    before = set(os.listdir(MODELS_DIR))
    tmp_dir = tempfile.mkdtemp(prefix="mlops_")
    script_path = os.path.join(tmp_dir, "script.py")

    try:
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)

        container_name = f"mlops-exec-{run_id}"

        cmd = [
            "docker", "run",
            "--rm",
            "--name", container_name,
            "--memory", MEMORY_LIMIT,
            "--cpus", CPU_LIMIT,
            "--network", "none",
            "--volume", f"{tmp_dir}:/app",
            "--volume", f"{MODELS_DIR}:/app/models",
            "--workdir", "/app",
            DOCKER_IMAGE,
            "python", "script.py"
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SEC
        )

        raw_output = result.stdout.strip()

        parsed_data = None
        try:
            parsed_data = json.loads(raw_output)
        except (json.JSONDecodeError, ValueError):
            pass

        after = set(os.listdir(MODELS_DIR))
        new_models = [f for f in (after - before) if f.endswith(".pkl")]
        model_saved = len(new_models) > 0

        if model_saved and isinstance(parsed_data, dict):
            if "model_path" not in parsed_data:
                parsed_data["model_path"] = f"models/{new_models[0]}"
            parsed_data["all_models"] = [f"models/{m}" for m in new_models]

        return {
            "run_id": run_id,
            "output": raw_output,
            "data": parsed_data,
            "error": result.stderr.strip(),
            "exit_code": result.returncode,
            "model_saved": model_saved,
            "new_models": new_models
        }

    except subprocess.TimeoutExpired:
        subprocess.run(["docker", "kill", container_name], capture_output=True)
        return {
            "run_id": run_id,
            "output": "",
            "data": None,
            "error": f"Execution timed out after {TIMEOUT_SEC} seconds.",
            "exit_code": -1,
            "model_saved": False,
            "new_models": []
        }

    except FileNotFoundError:
        return {
            "run_id": run_id,
            "output": "",
            "data": None,
            "error": "Docker is not installed or not running.",
            "exit_code": -2,
            "model_saved": False,
            "new_models": []
        }

    except Exception as e:
        return {
            "run_id": run_id,
            "output": "",
            "data": None,
            "error": f"Unexpected error: {str(e)}",
            "exit_code": -3,
            "model_saved": False,
            "new_models": []
        }

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
