import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { predict, getModelInfo, type ModelMetadata, type PredictResponse } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Loader from '../common/Loader';
import { Play, CheckCircle2, FileJson, AlertCircle } from 'lucide-react';

interface ApiTesterProps {
  modelName: string;
}

export default function ApiTester({ modelName }: ApiTesterProps) {
  const { addToast } = useAppContext();
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<PredictResponse | null>(null);
  const [errorResponse, setErrorResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Fetch model metadata to build default request
  useEffect(() => {
    if (!modelName) return;

    setLoadingMeta(true);
    setResponse(null);
    setErrorResponse(null);

    const nameNoExt = modelName.replace('.pkl', '');
    getModelInfo(nameNoExt)
      .then((meta) => {
        setMetadata(meta);
        if (meta && meta.features && meta.features.length > 0) {
          const features: Record<string, number> = {};
          meta.features.forEach((f) => (features[f] = 0));
          setRequestBody(
            JSON.stringify({ model: modelName, features }, null, 2)
          );
        } else {
          setRequestBody(
            JSON.stringify(
              { model: modelName, features: [0, 0, 0, 0] },
              null,
              2
            )
          );
        }
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
    setLoading(true);
    setResponse(null);
    setErrorResponse(null);
    
    try {
      const body = JSON.parse(requestBody);
      const result = await predict(body);
      setResponse(result);
      addToast('success', `Prediction completed`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Prediction failed';
      setErrorResponse(JSON.stringify({ error: msg }, null, 2));
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!modelName) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Select a model from the left to test.</p>
      </div>
    );
  }

  if (loadingMeta) {
    return <Loader message="Loading model info…" inline />;
  }

  return (
    <div className="fade-in" id="api-tester">
      {metadata?.features && (
        <div style={{ marginBottom: 16 }}>
          <span className="form-label">Expected Features</span>
          <div className="chip-grid">
            {metadata.features.map((f) => (
              <span className="chip selected" key={f}>{f}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileJson size={14} /> Request Payload
        </span>
        <div className="monaco-container">
          <Editor
            height="180px"
            language="json"
            theme="vs-dark"
            value={requestBody}
            onChange={(v) => setRequestBody(v ?? '')}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              lineNumbersMinChars: 3,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handlePredict}
        disabled={loading}
        id="btn-predict"
        style={{ width: '100%', marginBottom: 24, padding: '12px' }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Running Inference…
          </>
        ) : (
          <>
            <Play size={18} />
            Run Prediction
          </>
        )}
      </button>

      {/* Response Panel */}
      {(response || errorResponse) && (
        <div className="fade-in" style={{ 
            background: response ? 'var(--success-bg)' : 'var(--error-bg)', 
            border: `1px solid ${response ? 'var(--success)' : 'var(--error)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
          {/* Subtle gradient glow in background */}
          <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: response ? 'var(--success)' : 'var(--error)'
          }} />

          {response && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Success</h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <div style={{ background: 'var(--bg-surface)', padding: '16px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Predicted Value</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                        {response.prediction}
                    </div>
                </div>
                {response.probability && (
                  <div style={{ background: 'var(--bg-surface)', padding: '16px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confidence Scores</div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {response.probability.map((p, i) => (
                             <span key={i} style={{ opacity: p > 0.5 ? 1 : 0.5, fontWeight: p > 0.5 ? 600 : 400 }}>
                                 C{i}: {(p * 100).toFixed(1)}%
                             </span>
                          ))}
                      </div>
                  </div>
                )}
              </div>

              <details>
                  <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>View raw JSON response</summary>
                  <div className="logs-panel" style={{ maxHeight: 150, marginTop: 12 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
              </details>
            </div>
          )}

          {errorResponse && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertCircle size={20} style={{ color: 'var(--error)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--error)' }}>Error</h3>
              </div>
              <div className="logs-panel" style={{ maxHeight: 200, background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--error)' }}>
                  {errorResponse}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
