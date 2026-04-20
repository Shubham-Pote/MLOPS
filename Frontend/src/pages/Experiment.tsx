import { useState, useCallback } from 'react';
import ModelSelector from '../components/experiment/ModelSelector';
import MonacoCodeEditor from '../components/experiment/MonacoCodeEditor';
import LogsPanel from '../components/results/LogsPanel';
import MetricsCards from '../components/results/MetricsCards';
import MetricsChart from '../components/results/MetricsChart';
import { runCode } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { extractMetrics } from '../utils/helpers';
import { Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { MODEL_TEMPLATES } from '../utils/constants';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export default function Experiment() {
  const { addToast } = useAppContext();
  const firstTemplate = Object.keys(MODEL_TEMPLATES)[0];
  const [selectedTemplate, setSelectedTemplate] = useState(firstTemplate);
  const [code, setCode] = useState(MODEL_TEMPLATES[firstTemplate] || '');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);

  const now = () =>
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const addLog = useCallback(
    (message: string, type: LogEntry['type'] = 'info') => {
      setLogs((prev) => [...prev, { timestamp: now(), message, type }]);
    },
    []
  );

  const handleTemplateChange = (newCode: string, name: string) => {
    setSelectedTemplate(name);
    setCode(newCode);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      addToast('error', 'Code cannot be empty.');
      return;
    }

    setRunning(true);
    setLogs([]);
    setMetrics({});
    setRunResult(null);
    addLog('Submitting code to backend…');
    addLog('Container starting…');

    try {
      const result = await runCode(code);
      setRunResult(result.data);

      if (result.exit_code === 0) {
        addLog(`Run completed with exit code 0`, 'success');

        if (result.output) {
          addLog(`Output: ${result.output.slice(0, 300)}`, 'info');
        }

        if (result.model_saved) {
          addLog(`Model saved: ${result.new_models.join(', ')}`, 'success');
          addToast('success', `Model saved: ${result.new_models.join(', ')}`);
        }

        const extracted = extractMetrics(result.data);
        if (Object.keys(extracted).length > 0) {
          setMetrics(extracted);
          addLog(
            `Metrics — ${Object.entries(extracted)
              .map(([k, v]) => `${k}: ${(v * 100).toFixed(2)}%`)
              .join(', ')}`,
            'success'
          );
        }

        addToast('success', 'Experiment completed successfully!');
      } else {
        addLog(`Error (exit code ${result.exit_code}):`, 'error');
        if (result.error) {
          addLog(result.error, 'error');
        }
        addToast('error', 'Experiment failed. Check logs.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      addLog(`Fatal: ${msg}`, 'error');
      addToast('error', msg);
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setLogs([]);
    setMetrics({});
    setRunResult(null);
    setCode(MODEL_TEMPLATES[selectedTemplate] || '');
  };

  const hasResults = Object.keys(metrics).length > 0 || runResult !== null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Experiment</h1>
        <p>Write or select a training script, then execute it in an isolated Docker container.</p>
      </div>

      <div className={`page-grid ${hasResults ? 'page-grid-2' : ''}`}>
        {/* Left column: Editor */}
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title">Training Script</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleReset}
                  disabled={running}
                  id="btn-reset"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRun}
                  disabled={running}
                  id="btn-run"
                >
                  {running ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      Running…
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            <ModelSelector value={selectedTemplate} onChange={handleTemplateChange} />
            <MonacoCodeEditor value={code} onChange={setCode} height={hasResults ? '450px' : '650px'} />
          </div>

          {/* Logs */}
          {(logs.length > 0 || running || hasResults) && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Execution Logs</h3>
                {logs.length > 0 && (
                  <span className="badge badge-info">{logs.length} entries</span>
                )}
              </div>
              <LogsPanel logs={logs} />
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        {hasResults && (
        <div>
          {/* Metrics */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title">Model Metrics</h3>
              {Object.keys(metrics).length > 0 && (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} />
                  Computed
                </span>
              )}
            </div>
            <MetricsCards metrics={metrics} />
          </div>

          {/* Chart */}
          {Object.keys(metrics).length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3 className="card-title">Metrics Visualization</h3>
              </div>
              <MetricsChart metrics={metrics} />
            </div>
          )}

          {/* Raw output */}
          {runResult && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Run Output (JSON)</h3>
              </div>
              <div className="logs-panel" style={{ maxHeight: 300 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#a78bfa' }}>
                  {JSON.stringify(runResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
