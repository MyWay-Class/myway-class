export function formatTimestampInput(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function parseTimestampInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 1) return Math.max(0, Math.round(parts[0] * 1000));
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return Math.max(0, Math.round((minutes * 60 + seconds) * 1000));
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return Math.max(0, Math.round((hours * 3600 + minutes * 60 + seconds) * 1000));
  }
  return null;
}
