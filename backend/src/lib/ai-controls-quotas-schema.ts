export const AI_CONTROL_SCHEMA = `
CREATE TABLE IF NOT EXISTS ai_daily_usage (
  usage_date TEXT NOT NULL,
  user_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, user_id, feature)
);

CREATE TABLE IF NOT EXISTS ai_total_usage (
  usage_date TEXT NOT NULL,
  user_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, user_id)
);

CREATE TABLE IF NOT EXISTS ai_global_usage (
  usage_date TEXT NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usage_date, feature)
);

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  bucket_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

export const RATE_LIMITS = {
  perMinute: 10,
  perHour: 100,
} as const;

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMinuteWindowKey(date = new Date()): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${date.toISOString().slice(0, 10)}T${hours}:${minutes}Z`;
}

export function getHourWindowKey(date = new Date()): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  return `${date.toISOString().slice(0, 10)}T${hours}Z`;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  return forwarded || cfIp || 'unknown';
}
