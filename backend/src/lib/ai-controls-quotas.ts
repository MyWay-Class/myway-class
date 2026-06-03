import type { RuntimeBindings } from './runtime-env';

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

let schemaReady: Promise<void> | null = null;

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

export async function ensureSchema(db: NonNullable<RuntimeBindings['DB']>): Promise<void> {
  if (!schemaReady) {
    schemaReady = db
      .exec(AI_CONTROL_SCHEMA)
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }

  return schemaReady;
}

async function bumpBoundedCounter(
  db: NonNullable<RuntimeBindings['DB']>,
  query: string,
  selectQuery: string,
  bindings: (string | number)[],
  limit: number,
): Promise<{ allowed: boolean; count: number }> {
  const result = await db.prepare(query).bind(...bindings, limit).run();
  const changed = Number(result.meta?.changes ?? 0);
  if (changed <= 0) {
    return { allowed: false, count: limit };
  }

  const row = await db.prepare(selectQuery).bind(...bindings).first<{ count: number }>();
  return { allowed: true, count: row?.count ?? 0 };
}

export async function bumpDailyUsage(
  db: NonNullable<RuntimeBindings['DB']>,
  userId: string,
  feature: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const date = getTodayKey();
  const result = await bumpBoundedCounter(
    db,
    `
INSERT INTO ai_daily_usage (usage_date, user_id, feature, count)
VALUES (?, ?, ?, 1)
ON CONFLICT(usage_date, user_id, feature)
DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
WHERE count < ?;
`,
    `
SELECT count FROM ai_daily_usage
WHERE usage_date = ? AND user_id = ? AND feature = ?;
`,
    [date, userId, feature],
    limit,
  );

  if (!result.allowed) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(0, limit - result.count) };
}

export async function bumpDailyTotal(
  db: NonNullable<RuntimeBindings['DB']>,
  userId: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const date = getTodayKey();
  const result = await bumpBoundedCounter(
    db,
    `
INSERT INTO ai_total_usage (usage_date, user_id, count)
VALUES (?, ?, 1)
ON CONFLICT(usage_date, user_id)
DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
WHERE count < ?;
`,
    `
SELECT count FROM ai_total_usage
WHERE usage_date = ? AND user_id = ?;
`,
    [date, userId],
    limit,
  );

  if (!result.allowed) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(0, limit - result.count) };
}

export async function bumpGlobalQuota(
  db: NonNullable<RuntimeBindings['DB']>,
  feature: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const date = getTodayKey();
  const result = await bumpBoundedCounter(
    db,
    `
INSERT INTO ai_global_usage (usage_date, feature, count)
VALUES (?, ?, 1)
ON CONFLICT(usage_date, feature)
DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
WHERE count < ?;
`,
    `
SELECT count FROM ai_global_usage
WHERE usage_date = ? AND feature = ?;
`,
    [date, feature],
    limit,
  );

  if (!result.allowed) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(0, limit - result.count) };
}

export async function bumpRateLimit(
  db: NonNullable<RuntimeBindings['DB']>,
  bucketKey: string,
  bucketType: string,
  limit: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const result = await bumpBoundedCounter(
    db,
    `
INSERT INTO ai_rate_limits (bucket_key, bucket_type, count)
VALUES (?, ?, 1)
ON CONFLICT(bucket_key)
DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
WHERE count < ?;
`,
    `
SELECT count FROM ai_rate_limits
WHERE bucket_key = ?;
`,
    [bucketKey, bucketType],
    limit,
  );

  if (!result.allowed) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(0, limit - result.count) };
}
