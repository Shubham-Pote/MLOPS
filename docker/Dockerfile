# ── Base image ─────────────────────────────────────────────────────────────
FROM python:3.10-slim

# ── Install ML libraries ───────────────────────────────────────────────────
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    mlflow \
    joblib \
    matplotlib

# ── Working directory inside container ────────────────────────────────────
WORKDIR /app

# Default command (overridden at runtime)
CMD ["python", "script.py"]
