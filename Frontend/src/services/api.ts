import { ENDPOINTS } from '../utils/constants';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RunCodeRequest {
  code: string;
}

export interface RunCodeResponse {
  run_id: string;
  status: string;
  exit_code: number;
  output: string;
  data: Record<string, unknown> | null;
  error: string;
  model_saved: boolean;
  new_models: string[];
}

export interface ModelInfo {
  filename: string;
  path: string;
  size_kb: number;
  created_at: string;
}

export interface ModelMetadata {
  features?: string[];
  target?: string;
  class_names?: Record<string, string>;
}

export interface PredictRequest {
  model: string;
  features: Record<string, number> | number[];
}

export interface PredictResponse {
  status: string;
  model: string;
  prediction: number;
  probability: number[] | null;
}

export interface ExperimentRun {
  run_id: string;
  run_name: string;
  status: string;
  start_time: string;
  metrics: Record<string, number>;
  params: Record<string, string>;
}

// ── API Functions ──────────────────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

/** Execute code in a Docker container */
export async function runCode(code: string): Promise<RunCodeResponse> {
  return request<RunCodeResponse>(ENDPOINTS.RUN_CODE, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/** List all saved models */
export async function getModels(): Promise<{ count: number; models: ModelInfo[] }> {
  return request(ENDPOINTS.MODELS);
}

/** Get model metadata (features, target) */
export async function getModelInfo(modelName: string): Promise<ModelMetadata> {
  return request(ENDPOINTS.MODEL_INFO(modelName));
}

/** Delete a model */
export async function deleteModel(filename: string): Promise<{ message: string }> {
  return request(ENDPOINTS.MODEL_DELETE(filename), { method: 'DELETE' });
}

/** Run a prediction */
export async function predict(req: PredictRequest): Promise<PredictResponse> {
  return request<PredictResponse>(ENDPOINTS.PREDICT, {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/** Get experiment history */
export async function getExperiments(
  limit = 20
): Promise<{ count: number; runs: ExperimentRun[] }> {
  return request(`${ENDPOINTS.EXPERIMENTS}?limit=${limit}`);
}

/** Health check */
export async function healthCheck(): Promise<{ status: string }> {
  return request(ENDPOINTS.HEALTH);
}
