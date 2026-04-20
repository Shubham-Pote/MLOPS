import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  predict,
  getModelInfo,
  type ModelMetadata,
  type PredictResponse,
} from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Loader from '../common/Loader';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileJson,
  RotateCcw,
} from 'lucide-react';

interface PredictionPanelProps {
  modelName: string;
}

type ViewState = 'request' | 'loading' | 'response' | 'error';

export default function PredictionPanel({ modelName }: PredictionPanelProps) {
  const { addToast } = useAppContext();
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<PredictResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [view, setView] = useState<ViewState>('request');

  useEffect(() => {
    if (!modelName) return;
    setLoadingMeta(true);
    setResponse(null);
    setErrorText(null);
    setView('request');

    getModelInfo(modelName)
      .then((meta) => {
        setMetadata(meta);
        const features: Record<string, number> =
          meta?.features && meta.features.length > 0
            ? Object.fromEntries(meta.features.map((f) => [f, 0]))
            : { feature_1: 0, feature_2: 0, feature_3: 0, feature_4: 0 };
        setRequestBody(
          JSON.stringify({ model: modelName, features }, null, 2)
        );
      })
      .catch(() => {
        setMetadata(null);
        setRequestBody(
          JSON.stringify(
            { model: modelName, features: [0, 0, 0, 0] },
            null,
            2
          )
        );
      })
      .finally(() => setLoadingMeta(false));
  }, [modelName]);

  const handlePredict = async () => {
    setView('loading');
    setResponse(null);
    setErrorText(null);
    try {
      const body = JSON.parse(requestBody);
      const result = await predict(body);
      setResponse(result);
      setView('response');
      addToast('success', 'Prediction completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Prediction failed';
      setErrorText(msg);
      setView('error');
      addToast('error', msg);
    }
  };

  const handleReset = () => {
    setResponse(null);
    setErrorText(null);
    setView('request');
  };

  if (!modelName) {
    return (
      <div className="empty-state" style={{ padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Select a model from the list to begin.
        </p>
      </div>
    );
  }

  if (loadingMeta) {
    return (
      <div style={{ padding: '48px 0' }}>
        <Loader message="Loading model metadata…" inline />
      </div>
    );
  }

  return (
    <div id="prediction-panel">
      {/* ── REQUEST VIEW ────────────────────────────────────────────────── */}
      {view === 'request' && (
        <div className="card fade-in">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileJson size={18} style={{ color: 'var(--info)' }} />
              Request Payload
            </h3>
          </div>

          {/* Feature chips removed */}

          {/* JSON editor */}
          <div className="monaco-container" style={{ marginBottom: 24 }}>
            <Editor
              height="240px"
              language="json"
              theme="vs-dark"
              value={requestBody}
              onChange={(v) => setRequestBody(v ?? '')}
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbersMinChars: 3,
                automaticLayout: true,
                wordWrap: 'on',
                renderLineHighlight: 'gutter',
              }}
            />
          </div>

          {/* Run button */}
          <button
            className="btn btn-primary btn-lg"
            onClick={handlePredict}
            id="btn-predict"
            style={{ width: '100%' }}
          >
            <Play size={18} />
            Run Prediction
          </button>
        </div>
      )}

      {/* ── LOADING VIEW ────────────────────────────────────────────────── */}
      {view === 'loading' && (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div className="spinner" style={{ width: 44, height: 44, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Running inference on <strong>{modelName}</strong>…
          </p>
        </div>
      )}

      {/* ── RESPONSE VIEW (success) ─────────────────────────────────────── */}
      {view === 'response' && response && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} style={{ color: 'var(--accent-end)' }} />
                Prediction Result
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={handleReset} id="btn-new-prediction">
                <RotateCcw size={14} />
                New Prediction
              </button>
            </div>

            {/* Status banner */}
            <div className="predict-status success" style={{ marginBottom: 24 }}>
              <CheckCircle2 size={18} />
              <span>Inference Successful</span>
            </div>

            {/* Prediction hero */}
            <div className="predict-hero-card" style={{ marginBottom: 24 }}>
              <span className="predict-hero-label">
                {metadata?.target || 'Prediction Result'}
              </span>
              <span className="predict-hero-value">
                {metadata?.class_names && metadata.class_names[response.prediction]
                  ? metadata.class_names[response.prediction]
                  : typeof response.prediction === 'number' && !Number.isInteger(response.prediction)
                  ? response.prediction.toFixed(4) 
                  : String(response.prediction)}
              </span>
            </div>

            {/* Probability bars */}
            {response.probability && response.probability.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <span className="form-label" style={{ marginBottom: 12 }}>
                  Confidence Distribution
                </span>
                <div className="predict-proba-bars">
                  {response.probability.map((p, i) => {
                    const pct = +(p * 100).toFixed(1);
                    const isMax = p === Math.max(...(response.probability ?? []));
                    const className = metadata?.class_names && metadata.class_names[i] 
                      ? metadata.class_names[i] 
                      : `Class ${i}`;
                    return (
                      <div className="predict-proba-row" key={i}>
                        <span className="predict-proba-label">{className}</span>
                        <div className="predict-proba-track">
                          <div
                            className={`predict-proba-fill ${isMax ? 'max' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`predict-proba-pct ${isMax ? 'max' : ''}`}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collapsible raw JSON */}
            <details className="predict-raw">
              <summary>View raw JSON</summary>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}

      {/* ── ERROR VIEW ──────────────────────────────────────────────────── */}
      {view === 'error' && errorText && (
        <div className="fade-in">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} style={{ color: 'var(--error)' }} />
                Prediction Failed
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={handleReset} id="btn-retry-prediction">
                <RotateCcw size={14} />
                Try Again
              </button>
            </div>

            <div className="predict-status error" style={{ marginBottom: 16 }}>
              <AlertCircle size={18} />
              <span>Inference Failed</span>
            </div>

            <div className="predict-error-body">{errorText}</div>
          </div>
        </div>
      )}
    </div>
  );
}
