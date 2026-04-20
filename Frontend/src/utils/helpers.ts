/**
 * Format a number as a percentage string.
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format bytes to human-readable size.
 */
export function formatSize(kb: number): string {
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

/**
 * Format a date string to a relative or short format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Truncate a string to a max length.
 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

/**
 * Parse output data from run-code response.
 */
export function extractMetrics(data: Record<string, unknown> | null): Record<string, number> {
  if (!data) return {};
  const metricKeys = ['accuracy', 'precision', 'recall', 'f1', 'loss', 'score', 'mse', 'r2', 'mae'];
  const metrics: Record<string, number> = {};
  for (const key of metricKeys) {
    if (key in data && typeof data[key] === 'number') {
      metrics[key] = data[key] as number;
    }
  }
  return metrics;
}
