import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getModels,
  getExperiments,
  healthCheck,
  type ModelInfo,
  type ExperimentRun,
} from '../services/api';
import MetricsCards from '../components/results/MetricsCards';
import {
  FlaskConical,
  Cpu,
  Rocket,
  Activity,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [health, setHealth] = useState<string>('checking');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [modelsRes, runsRes, healthRes] = await Promise.allSettled([
          getModels(),
          getExperiments(5),
          healthCheck(),
        ]);

        if (modelsRes.status === 'fulfilled') setModels(modelsRes.value.models);
        if (runsRes.status === 'fulfilled') setRuns(runsRes.value.runs);
        setHealth(
          healthRes.status === 'fulfilled' ? healthRes.value.status : 'error'
        );
      } catch {
        setHealth('error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Aggregate latest metrics from runs
  const latestMetrics: Record<string, number> = {};
  if (runs.length > 0 && runs[0].metrics) {
    Object.entries(runs[0].metrics).forEach(([k, v]) => {
      if (typeof v === 'number' && !isNaN(v)) latestMetrics[k] = v;
    });
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your ML platform status and recent activity.</p>
      </div>

      {/* Stat Cards Row */}
      <div className="metrics-grid" style={{ marginBottom: 32 }}>
        <div
          className="metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/models')}
        >
          <div className="metric-icon purple">
            <Cpu size={20} />
          </div>
          <div className="metric-value">{loading ? '—' : models.length}</div>
          <div className="metric-label">Saved Models</div>
        </div>

        <div
          className="metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/results')}
        >
          <div className="metric-icon blue">
            <FlaskConical size={20} />
          </div>
          <div className="metric-value">{loading ? '—' : runs.length}</div>
          <div className="metric-label">Experiment Runs</div>
        </div>

        <div className="metric-card">
          <div className={`metric-icon ${health === 'ok' ? 'green' : 'red'}`}>
            <Activity size={20} />
          </div>
          <div className="metric-value" style={{ fontSize: '1.3rem' }}>
            {health === 'checking' ? '…' : health === 'ok' ? 'Online' : 'Offline'}
          </div>
          <div className="metric-label">Backend Status</div>
        </div>

        <div
          className="metric-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/deploy')}
        >
          <div className="metric-icon amber">
            <Rocket size={20} />
          </div>
          <div className="metric-value" style={{ fontSize: '1.3rem' }}>
            Ready
          </div>
          <div className="metric-label">Deployment</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="page-grid page-grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} style={{ color: 'var(--accent-end)' }} />
              Quick Actions
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ justifyContent: 'space-between' }}
              onClick={() => navigate('/experiment')}
              id="quick-new-experiment"
            >
              New Experiment
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between' }}
              onClick={() => navigate('/deploy')}
              id="quick-deploy"
            >
              Deploy & Predict
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Latest Metrics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Latest Metrics</h3>
            <span className="badge badge-info">
              <Clock size={12} /> Most Recent
            </span>
          </div>
          {Object.keys(latestMetrics).length > 0 ? (
            <MetricsCards metrics={latestMetrics} />
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {loading ? 'Loading…' : 'No experiment metrics yet. Run your first experiment!'}
            </p>
          )}
        </div>
      </div>

      {/* Recent Experiments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Experiments</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/results')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        {runs.length > 0 ? (
          <div className="data-table-wrapper">
            <table className="data-table" id="dashboard-runs-table">
              <thead>
                <tr>
                  <th>Run Name</th>
                  <th>Status</th>
                  <th>Algorithm</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.run_id}>
                    <td style={{ fontWeight: 500 }}>{run.run_name || run.run_id.slice(0, 8)}</td>
                    <td>
                      <span className={`badge badge-${run.status === 'FINISHED' ? 'success' : 'warning'}`}>
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
                      {run.start_time ? new Date(run.start_time).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>
            {loading ? 'Loading…' : 'No experiments yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
