import { useState, useEffect } from 'react';
import { getModels, type ModelInfo } from '../services/api';
import PredictionPanel from '../components/deployment/PredictionPanel';
import Loader from '../components/common/Loader';
import { formatSize } from '../utils/helpers';
import { Search, BrainCircuit, Cpu, ArrowLeft, Clock, HardDrive } from 'lucide-react';

export default function Deploy() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getModels()
      .then((res) => {
        setModels(res.models);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredModels = models.filter((m) =>
    m.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── MODEL SELECTION view ─────────────────────────────────────────────── */
  if (!selected) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Model Playground</h1>
          <p>Choose a trained model to start running live inference.</p>
        </div>

        {/* Search bar */}
        <div className="deploy-search-wrap" style={{ maxWidth: '100%', margin: '0 0 24px' }}>
          <Search size={18} className="deploy-search-icon" />
          <input
            id="deploy-search"
            type="text"
            className="deploy-search-input"
            placeholder="Search models by name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <span className="deploy-search-badge">
              {filteredModels.length} result{filteredModels.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Model grid */}
        {loading ? (
          <Loader message="Fetching models…" inline />
        ) : models.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 0' }}>
            <Cpu size={52} className="empty-state-icon" />
            <h3>No models available</h3>
            <p>Train a model first from the Experiment page, then come back here.</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <Search size={44} className="empty-state-icon" />
            <h3>No matches</h3>
            <p>No models match "{searchTerm}". Try a different keyword.</p>
          </div>
        ) : (
          <div className="deploy-model-grid">
            {filteredModels.map((m) => (
              <button
                key={m.filename}
                className="deploy-model-card"
                onClick={() => setSelected(m.filename)}
                id={`select-${m.filename}`}
              >
                <div className="deploy-model-card-icon">
                  <BrainCircuit size={24} />
                </div>
                <div className="deploy-model-card-body">
                  <span className="deploy-model-card-name">{m.filename}</span>
                  <div className="deploy-model-card-meta">
                    <span><HardDrive size={12} /> {formatSize(m.size_kb)}</span>
                    <span><Clock size={12} /> {m.created_at}</span>
                  </div>
                </div>
                <div className="deploy-model-card-arrow">→</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── INFERENCE view ───────────────────────────────────────────────────── */
  return (
    <div className="fade-in">
      {/* Top bar: back + model badge */}
      <div className="deploy-topbar">
        <button className="btn btn-secondary" onClick={() => setSelected('')} id="btn-back-models">
          <ArrowLeft size={16} />
          All Models
        </button>

        <div className="deploy-active-badge">
          <div className="deploy-active-badge-dot" />
          <BrainCircuit size={16} />
          <span>{selected}</span>
        </div>
      </div>

      {/* Inference panel takes full width */}
      <PredictionPanel modelName={selected} />
    </div>
  );
}
