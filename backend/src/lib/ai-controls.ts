import type { AuthUser } from '@myway/shared';
import { getAuthenticatedUser } from './auth';
import { jsonFailure } from './http';
import { getAIRuntimePolicy, type RuntimeBindings } from './runtime-env';
import {
  bumpDailyTotal,
  bumpDailyUsage,
  bumpGlobalQuota,
  bumpRateLimit,
  ensureSchema,
  getClientIp,
  getHourWindowKey,
  getMinuteWindowKey,
  RATE_LIMITS,
} from './ai-controls-quotas';

export type AiControlFeature = 'intent' | 'search' | 'answer' | 'summary' | 'quiz' | 'smart' | 'stt';

export type AiControlContext = {
  user: AuthUser | null;
  policy: ReturnType<typeof getAIRuntimePolicy>;
};

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
