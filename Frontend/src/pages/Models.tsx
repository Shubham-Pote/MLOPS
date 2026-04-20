import { useState, useEffect } from 'react';
import { getModels, deleteModel, type ModelInfo } from '../services/api';
import { useAppContext } from '../context/AppContext';
import Loader from '../components/common/Loader';
import { formatSize, formatDate } from '../utils/helpers';
import { Cpu, Trash2, RefreshCw, Download, FileBox } from 'lucide-react';

export default function Models() {
  const { addToast } = useAppContext();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await getModels();
      setModels(res.models);
    } catch {
      addToast('error', 'Failed to load models.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete model "${filename}"? This cannot be undone.`)) return;
    setDeleting(filename);
    try {
      await deleteModel(filename);
      addToast('success', `Deleted ${filename}`);
      setModels((prev) => prev.filter((m) => m.filename !== filename));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      addToast('error', msg);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Models</h1>
        <p>Manage your saved machine learning models.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} style={{ color: 'var(--accent-end)' }} />
            Saved Models ({models.length})
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchModels}
            disabled={loading}
            id="btn-refresh-models"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {loading ? (
          <Loader message="Loading models…" inline />
        ) : models.length === 0 ? (
          <div className="empty-state">
            <FileBox size={48} className="empty-state-icon" />
            <h3>No models yet</h3>
            <p>Train your first model in the Experiment page.</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table" id="models-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Path</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.filename}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(139, 92, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Download size={14} style={{ color: '#a78bfa' }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{model.filename}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {model.path}
                    </td>
                    <td>{formatSize(model.size_kb)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {formatDate(model.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(model.filename)}
                        disabled={deleting === model.filename}
                        id={`delete-${model.filename}`}
                      >
                        {deleting === model.filename ? (
                          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
