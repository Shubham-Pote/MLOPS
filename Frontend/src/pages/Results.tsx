import { useState, useEffect } from 'react';
import { getExperiments, type ExperimentRun } from '../services/api';
import MetricsCards from '../components/results/MetricsCards';
import MetricsChart from '../components/results/MetricsChart';
import Loader from '../components/common/Loader';
import { RefreshCw, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function Results() {
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<ExperimentRun | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await getExperiments(50);
      setRuns(res.runs);
      if (res.runs.length > 0 && !selectedRun) {
        setSelectedRun(res.runs[0]);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const selectedMetrics: Record<string, number> = {};
  if (selectedRun?.metrics) {
    Object.entries(selectedRun.metrics).forEach(([k, v]) => {
      if (typeof v === 'number' && !isNaN(v)) selectedMetrics[k] = v;
    });
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Results</h1>
        <p>View experiment history, compare metrics, and analyze model performance.</p>
      </div>

      {/* Metrics of selected run */}
      {selectedRun && Object.keys(selectedMetrics).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 className="section-title" style={{ margin: 0 }}>
              Metrics — {selectedRun.run_name || selectedRun.run_id.slice(0, 8)}
            </h3>
            <span className="badge badge-success">Selected</span>
          </div>
          <MetricsCards metrics={selectedMetrics} />
        </div>
      )}

      {/* Chart */}
      {selectedRun && Object.keys(selectedMetrics).length > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-header">
            <h3 className="card-title">Performance Chart</h3>
          </div>
          <MetricsChart metrics={selectedMetrics} />
        </div>
      )}

      {/* Runs Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            All Experiment Runs
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchRuns}
            disabled={loading}
            id="btn-refresh-results"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <Loader message="Loading experiments…" inline />
        ) : runs.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} className="empty-state-icon" />
            <h3>No experiments yet</h3>
            <p>Run your first experiment to see results here.</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table" id="results-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Run Name</th>
                  <th>Status</th>
                  <th>Algorithm</th>
                  <th>Accuracy</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const isSelected = selectedRun?.run_id === run.run_id;
                  const isExpanded = expandedRow === run.run_id;

                  return (
                    <>
                      <tr
                        key={run.run_id}
                        style={{
                          cursor: 'pointer',
                          background: isSelected
                            ? 'rgba(99, 102, 241, 0.08)'
                            : undefined,
                        }}
                        onClick={() => setSelectedRun(run)}
                      >
                        <td>
                          <button
                            className="btn-icon"
                            style={{ width: 28, height: 28, border: 'none' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(isExpanded ? null : run.run_id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </td>
                        <td style={{ fontWeight: isSelected ? 600 : 400 }}>
                          {run.run_name || run.run_id.slice(0, 8)}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${
                              run.status === 'FINISHED' ? 'success' : 'warning'
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td>{run.params?.algorithm || '—'}</td>
                        <td>
                          {run.metrics?.accuracy != null
                            ? `${(run.metrics.accuracy * 100).toFixed(2)}%`
                            : '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {run.start_time
                            ? new Date(run.start_time).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${run.run_id}-detail`}>
                          <td colSpan={6} style={{ padding: '16px 24px', background: 'var(--bg-surface)' }}>
                            <div className="page-grid page-grid-2" style={{ gap: 16 }}>
                              <div>
                                <h4 className="form-label" style={{ marginBottom: 8 }}>Parameters</h4>
                                {Object.entries(run.params || {}).map(([k, v]) => (
                                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                    <span>{v}</span>
                                  </div>
                                ))}
                                {Object.keys(run.params || {}).length === 0 && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No params logged</span>
                                )}
                              </div>
                              <div>
                                <h4 className="form-label" style={{ marginBottom: 8 }}>Metrics</h4>
                                {Object.entries(run.metrics || {}).map(([k, v]) => (
                                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                    <span style={{ color: 'var(--success)' }}>{typeof v === 'number' ? v.toFixed(4) : v}</span>
                                  </div>
                                ))}
                                {Object.keys(run.metrics || {}).length === 0 && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No metrics logged</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
