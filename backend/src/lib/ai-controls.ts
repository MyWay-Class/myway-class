import type { AuthUser } from '@myway/shared';
import { getAuthenticatedUser } from './auth';
import { jsonFailure } from './http';
import { getAIRuntimePolicy, type RuntimeBindings } from './runtime-env';

export type AiControlFeature = 'intent' | 'search' | 'answer' | 'summary' | 'quiz' | 'smart' | 'stt';

export type AiControlContext = {
  user: AuthUser | null;
  policy: ReturnType<typeof getAIRuntimePolicy>;
};

const AI_CONTROL_SCHEMA = `
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

const RATE_LIMITS = {
  perMinute: 10,
  perHour: 100,
} as const;

let schemaReady: Promise<void> | null = null;

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMinuteWindowKey(date = new Date()): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${date.toISOString().slice(0, 10)}T${hours}:${minutes}Z`;
}

function getHourWindowKey(date = new Date()): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  return `${date.toISOString().slice(0, 10)}T${hours}Z`;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  return forwarded || cfIp || 'unknown';
}

function getQuotaLimit(policy: AiControlContext['policy'], feature: AiControlFeature): number | undefined {
  switch (feature) {
    case 'intent':
    case 'smart':
      return policy.daily_limits.smart;
    case 'summary':
      return policy.daily_limits.summary;
    case 'quiz':
      return policy.daily_limits.quiz;
    case 'answer':
      return policy.daily_limits.answer;
    case 'stt':
      return policy.daily_limits.stt;
    case 'search':
      return undefined;
  }
}

function shouldCountTotal(feature: AiControlFeature): boolean {
  return feature !== 'search';
}

function shouldCountGemini(feature: AiControlFeature): boolean {
  return feature !== 'search' && feature !== 'stt';
}

async function ensureSchema(db: NonNullable<RuntimeBindings['DB']>): Promise<void> {
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

async function bumpDailyUsage(
  db: NonNullable<RuntimeBindings['DB']>,
  userId: string,
  feature: AiControlFeature,
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

async function bumpDailyTotal(
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

async function bumpGlobalQuota(
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

async function bumpRateLimit(
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

export async function guardAiRequest(
  request: Request,
  env: RuntimeBindings | undefined,
  feature: AiControlFeature,
): Promise<AiControlContext | Response> {
  const policy = getAIRuntimePolicy(env);
  const user = getAuthenticatedUser(request);

  if (policy.require_auth && !user) {
    return jsonFailure('AI_AUTH_REQUIRED', 'AI 기능은 로그인 후 사용할 수 있습니다.', 401);
  }

  if (feature === 'stt' && !policy.enable_stt) {
    return jsonFailure('STT_DISABLED', '현재 환경에서는 STT 기능이 비활성화되어 있습니다.', 403);
  }

  if (policy.public_mode === 'dev') {
    return { user, policy };
  }

  const db = env?.DB;
  if (!db) {
    return jsonFailure('AI_QUOTA_STORAGE_REQUIRED', '공개 테스트 quota 저장소가 필요합니다.', 503);
  }

  await ensureSchema(db);

  const ip = getClientIp(request);
  const minuteWindow = getMinuteWindowKey();
  const hourWindow = getHourWindowKey();

  const minuteLimit = await bumpRateLimit(db, `minute:${feature}:${ip}:${minuteWindow}`, 'minute', RATE_LIMITS.perMinute);
  if (!minuteLimit.allowed) {
    return jsonFailure('RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', 429);
  }

  const hourLimit = await bumpRateLimit(db, `hour:${feature}:${ip}:${hourWindow}`, 'hour', RATE_LIMITS.perHour);
  if (!hourLimit.allowed) {
    return jsonFailure('RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', 429);
  }

  if (feature === 'search') {
    return { user, policy };
  }

  const quotaLimit = getQuotaLimit(policy, feature);
  if (!quotaLimit) {
    return { user, policy };
  }

  const actorId = user?.id ?? 'anonymous';

  const dailyUsage = await bumpDailyUsage(db, actorId, feature, quotaLimit);
  if (!dailyUsage.allowed) {
    return jsonFailure('AI_QUOTA_EXCEEDED', '일일 사용 한도를 초과했습니다.', 429);
  }

  if (policy.daily_limits.total && shouldCountTotal(feature)) {
    const totalUsage = await bumpDailyTotal(db, actorId, policy.daily_limits.total);
    if (!totalUsage.allowed) {
      return jsonFailure('AI_TOTAL_QUOTA_EXCEEDED', '일일 AI 총 사용 한도를 초과했습니다.', 429);
    }
  }

  if (policy.daily_limits.gemini && shouldCountGemini(feature)) {
    const geminiUsage = await bumpGlobalQuota(db, 'gemini', policy.daily_limits.gemini);
    if (!geminiUsage.allowed) {
      return jsonFailure('AI_GEMINI_QUOTA_EXCEEDED', 'Gemini 일일 사용 한도를 초과했습니다.', 429);
    }
  }

  return { user, policy };
}
