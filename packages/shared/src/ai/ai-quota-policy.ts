import type { UserRole } from '../types';

export type AIQuotaFeature = 'intent' | 'search' | 'answer' | 'summary' | 'quiz' | 'smart' | 'stt' | 'rag';

export type AIQuotaPolicyInput = {
  daily_limit?: number;
  role_daily_limits?: Partial<Record<UserRole, number>>;
  feature_weights?: Partial<Record<AIQuotaFeature, number>>;
};

export type AIQuotaResolution = {
  role: UserRole;
  feature: AIQuotaFeature;
  base_limit: number;
  feature_weight: number;
  effective_limit: number;
};

export const DEFAULT_AI_ROLE_DAILY_LIMITS: Record<UserRole, number> = {
  STUDENT: 100,
  INSTRUCTOR: 200,
  ADMIN: 500,
};

export const DEFAULT_AI_FEATURE_WEIGHTS: Record<AIQuotaFeature, number> = {
  intent: 1,
  search: 0,
  answer: 1,
  summary: 1.2,
  quiz: 1.1,
  smart: 1.25,
  stt: 1.5,
  rag: 1.5,
};

export function normalizeAiQuotaRole(role?: string | null): UserRole {
  const normalized = String(role ?? '').trim().toUpperCase();
  if (normalized === 'INSTRUCTOR' || normalized === 'ADMIN') {
    return normalized;
  }
  return 'STUDENT';
}

export function resolveAiQuotaBaseLimit(role: UserRole, settings?: AIQuotaPolicyInput): number {
  const explicitLimit = settings?.daily_limit;
  if (typeof explicitLimit === 'number' && Number.isFinite(explicitLimit) && explicitLimit > 0) {
    return Math.floor(explicitLimit);
  }

  const roleLimit = settings?.role_daily_limits?.[role];
  if (typeof roleLimit === 'number' && Number.isFinite(roleLimit) && roleLimit > 0) {
    return Math.floor(roleLimit);
  }

  return DEFAULT_AI_ROLE_DAILY_LIMITS[role];
}

export function resolveAiQuotaFeatureWeight(feature: AIQuotaFeature, settings?: AIQuotaPolicyInput): number {
  const configuredWeight = settings?.feature_weights?.[feature];
  if (typeof configuredWeight === 'number' && Number.isFinite(configuredWeight) && configuredWeight > 0) {
    return configuredWeight;
  }

  return DEFAULT_AI_FEATURE_WEIGHTS[feature];
}

export function resolveAiQuotaLimit(role: string | UserRole | null | undefined, feature: AIQuotaFeature, settings?: AIQuotaPolicyInput): AIQuotaResolution {
  const normalizedRole = normalizeAiQuotaRole(role);
  const baseLimit = resolveAiQuotaBaseLimit(normalizedRole, settings);
  const featureWeight = resolveAiQuotaFeatureWeight(feature, settings);
  const effectiveLimit = featureWeight <= 0 ? baseLimit : Math.max(1, Math.floor(baseLimit / featureWeight));

  return {
    role: normalizedRole,
    feature,
    base_limit: baseLimit,
    feature_weight: featureWeight,
    effective_limit: effectiveLimit,
  };
}

export function getAiQuotaResetAt(now: Date = new Date()): string {
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  return reset.toISOString();
}
