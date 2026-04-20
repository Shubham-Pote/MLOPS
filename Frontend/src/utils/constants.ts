export const API_BASE = 'http://localhost:8000';

export const ENDPOINTS = {
  RUN_CODE: `${API_BASE}/run-code`,
  MODELS: `${API_BASE}/models`,
  MODEL_INFO: (name: string) => `${API_BASE}/model-info/${name}`,
  MODEL_DELETE: (name: string) => `${API_BASE}/models/${name}`,
  PREDICT: `${API_BASE}/predict`,
  EXPERIMENTS: `${API_BASE}/experiments`,
  HEALTH: `${API_BASE}/health`,
  METRICS: `${API_BASE}/metrics`,
} as const;

export const MODEL_TEMPLATES: Record<string, string> = {
  'Random Forest Classifier': `import json, joblib, numpy as np
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

data = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
prec = precision_score(y_test, preds, average='weighted', zero_division=0)
rec = recall_score(y_test, preds, average='weighted', zero_division=0)
f1 = f1_score(y_test, preds, average='weighted', zero_division=0)

joblib.dump(model, "models/iris_rf.pkl")

print(json.dumps({
    "algorithm": "RandomForestClassifier",
    "dataset": "iris",
    "accuracy": round(acc, 4),
    "precision": round(prec, 4),
    "recall": round(rec, 4),
    "f1": round(f1, 4),
    "train_samples": len(X_train),
    "test_samples": len(X_test),
    "model_path": "models/iris_rf.pkl",
    "metadata": {
        "features": list(data.feature_names),
        "target": "species",
        "class_names": {"0": "setosa", "1": "versicolor", "2": "virginica"}
    }
}))`,

  'Logistic Regression': `import json, joblib, numpy as np
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

data = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

model = LogisticRegression(max_iter=200, random_state=42)
model.fit(X_train, y_train)

preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
prec = precision_score(y_test, preds, average='weighted', zero_division=0)
rec = recall_score(y_test, preds, average='weighted', zero_division=0)
f1 = f1_score(y_test, preds, average='weighted', zero_division=0)

joblib.dump(model, "models/iris_lr.pkl")

print(json.dumps({
    "algorithm": "LogisticRegression",
    "dataset": "iris",
    "accuracy": round(acc, 4),
    "precision": round(prec, 4),
    "recall": round(rec, 4),
    "f1": round(f1, 4),
    "train_samples": len(X_train),
    "test_samples": len(X_test),
    "model_path": "models/iris_lr.pkl",
    "metadata": {
        "features": list(data.feature_names),
        "target": "species",
        "class_names": {"0": "setosa", "1": "versicolor", "2": "virginica"}
    }
}))`,

  'SVM Classifier': `import json, joblib, numpy as np
from sklearn.datasets import load_iris
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

data = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

model = SVC(kernel='rbf', probability=True, random_state=42)
model.fit(X_train, y_train)

preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
prec = precision_score(y_test, preds, average='weighted', zero_division=0)
rec = recall_score(y_test, preds, average='weighted', zero_division=0)
f1 = f1_score(y_test, preds, average='weighted', zero_division=0)

joblib.dump(model, "models/iris_svm.pkl")

print(json.dumps({
    "algorithm": "SVC",
    "dataset": "iris",
    "accuracy": round(acc, 4),
    "precision": round(prec, 4),
    "recall": round(rec, 4),
    "f1": round(f1, 4),
    "train_samples": len(X_train),
    "test_samples": len(X_test),
    "model_path": "models/iris_svm.pkl",
    "metadata": {
        "features": list(data.feature_names),
        "target": "species",
        "class_names": {"0": "setosa", "1": "versicolor", "2": "virginica"}
    }
}))`,

  'Custom Script': `# Write your own ML training script here.
# Requirements:
#   1. Train your model
#   2. Save it with: joblib.dump(model, "models/my_model.pkl")
#   3. Print a JSON object with results:
#      print(json.dumps({
#          "algorithm": "...",
#          "accuracy": 0.95,
#          "metadata": {
#              "features": ["feature1", "feature2"],
#              "target": "label"
#          }
#      }))

import json
import joblib
`,
};
