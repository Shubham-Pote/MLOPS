import { TrendingUp, Target, Zap, Award, AlertTriangle, BarChart } from 'lucide-react';

interface MetricsCardsProps {
  metrics: Record<string, number>;
}

const metricConfig: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  accuracy:  { icon: Target,         color: 'green',  label: 'Accuracy' },
  precision: { icon: Zap,            color: 'blue',   label: 'Precision' },
  recall:    { icon: Award,          color: 'purple', label: 'Recall' },
  f1:        { icon: TrendingUp,     color: 'cyan',   label: 'F1 Score' },
  loss:      { icon: AlertTriangle,  color: 'red',    label: 'Loss' },
  score:     { icon: BarChart,       color: 'amber',  label: 'Score' },
};

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const entries = Object.entries(metrics);

  if (entries.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No metrics available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="metrics-grid">
      {entries.map(([key, value]) => {
        const config = metricConfig[key] || { icon: BarChart, color: 'blue', label: key };
        const Icon = config.icon;
        const isPercent = ['accuracy', 'precision', 'recall', 'f1'].includes(key);
        const display = isPercent ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);

        return (
          <div className="metric-card fade-in" key={key} id={`metric-${key}`}>
            <div className={`metric-icon ${config.color}`}>
              <Icon size={20} />
            </div>
            <div className="metric-value">{display}</div>
            <div className="metric-label">{config.label}</div>
          </div>
        );
      })}
    </div>
  );
}
