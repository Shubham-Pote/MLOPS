interface LoaderProps {
  message?: string;
  inline?: boolean;
}

export default function Loader({ message = 'Loading...', inline = false }: LoaderProps) {
  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0' }}>
        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
        <span className="loader-text" style={{ margin: 0 }}>{message}</span>
      </div>
    );
  }

  return (
    <div className="loader-overlay" id="global-loader">
      <div className="spinner" />
      <p className="loader-text">{message}</p>
    </div>
  );
}
