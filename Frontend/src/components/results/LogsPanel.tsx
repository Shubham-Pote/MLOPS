interface LogsPanelProps {
  logs: Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'success' }>;
}

export default function LogsPanel({ logs }: LogsPanelProps) {
  if (logs.length === 0) {
    return (
      <div className="logs-panel" id="logs-panel">
        <div className="log-line">
          <span className="message" style={{ color: 'var(--text-muted)' }}>
            Waiting for execution logs…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="logs-panel" id="logs-panel">
      {logs.map((log, i) => (
        <div className="log-line" key={i}>
          <span className="timestamp">[{log.timestamp}]</span>
          <span className={`message ${log.type}`}>{log.message}</span>
        </div>
      ))}
    </div>
  );
}
