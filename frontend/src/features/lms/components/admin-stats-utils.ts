export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTokenCount(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function formatDelta(current: number, previous: number, suffix = ''): string {
  if (previous === 0) {
    if (current === 0) {
      return '변화 없음';
    }

    return `+${formatTokenCount(current)}${suffix}`;
  }

  const delta = ((current - previous) / previous) * 100;
  const prefix = delta >= 0 ? '+' : '';
  return `${prefix}${Math.round(delta)}%`;
}

export function buildHalfWindows<T>(items: T[]): { current: T[]; previous: T[] } {
  const pivot = Math.max(1, Math.ceil(items.length / 2));
  return {
    current: items.slice(0, pivot),
    previous: items.slice(pivot),
  };
}

export function getSuccessRate(logs: Array<{ success: number }>): number {
  if (logs.length === 0) {
    return 0;
  }

  return Math.round((logs.filter((log) => log.success === 1).length / logs.length) * 100);
}

export function getAverageLatency(logs: Array<{ latency_ms: number }>): number {
  if (logs.length === 0) {
    return 0;
  }

  return Math.round(logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length);
}

export function getTokenTotal(logs: Array<{ input_tokens: number; output_tokens: number }>): number {
  return logs.reduce((sum, log) => sum + log.input_tokens + log.output_tokens, 0);
}
