import type { AIReference } from '@myway/shared';

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatSeekTimecode(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function extractReferenceStartMs(reference: AIReference): number | null {
  const loose = reference as AIReference & {
    start_ms?: unknown;
    startMs?: unknown;
    timestamp_ms?: unknown;
    timestampMs?: unknown;
  };
  const direct =
    asFiniteNumber(loose.start_ms) ??
    asFiniteNumber(loose.startMs) ??
    asFiniteNumber(loose.timestamp_ms) ??
    asFiniteNumber(loose.timestampMs);
  if (direct !== null) {
    return Math.max(0, direct);
  }

  const haystack = `${reference.title ?? ''} ${reference.excerpt ?? ''} ${reference.content ?? ''}`;
  const hhmmss = haystack.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
  if (hhmmss) {
    const hours = Number(hhmmss[1]);
    const minutes = Number(hhmmss[2]);
    const seconds = Number(hhmmss[3]);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  const mmss = haystack.match(/\b([0-5]?\d):([0-5]\d)\b/);
  if (mmss) {
    const minutes = Number(mmss[1]);
    const seconds = Number(mmss[2]);
    return (minutes * 60 + seconds) * 1000;
  }

  return null;
}
