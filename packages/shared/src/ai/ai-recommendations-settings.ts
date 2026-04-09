import { getDemoUser } from '../data/demo-data';
import type {
  AIThemePreference,
  AIRecommendationMode,
  AIUserSettings,
  AIUserSettingsUpdateRequest,
  UserRole,
} from '../types';

const DEFAULT_SETTINGS: Record<UserRole, Omit<AIUserSettings, 'user_id' | 'updated_at'>> = {
  STUDENT: {
    language: 'ko',
    theme: 'system',
    auto_summary: true,
    recommendation_mode: 'progress',
  },
  INSTRUCTOR: {
    language: 'ko',
    theme: 'system',
    auto_summary: false,
    recommendation_mode: 'balanced',
  },
  ADMIN: {
    language: 'ko',
    theme: 'system',
    auto_summary: false,
    recommendation_mode: 'balanced',
  },
};

const storedSettings = new Map<string, AIUserSettings>();

function nowIso(): string {
  return new Date().toISOString();
}

function getUserRole(userId: string): UserRole {
  return getDemoUser(userId)?.role ?? 'STUDENT';
}

function getDefaultSettings(userId: string): AIUserSettings {
  const role = getUserRole(userId);
  return {
    user_id: userId,
    updated_at: nowIso(),
    ...DEFAULT_SETTINGS[role],
  };
}

export function getAIUserSettings(userId: string): AIUserSettings {
  const existing = storedSettings.get(userId);
  if (existing) {
    return existing;
  }

  const defaults = getDefaultSettings(userId);
  storedSettings.set(userId, defaults);
  return defaults;
}

function isAIThemePreference(value: unknown): value is AIThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isAIRecommendationMode(value: unknown): value is AIRecommendationMode {
  return value === 'progress' || value === 'discovery' || value === 'balanced';
}

export function updateAIUserSettings(userId: string, input: AIUserSettingsUpdateRequest): AIUserSettings {
  const current = getAIUserSettings(userId);
  let language = current.language;
  if (typeof input.language === 'string') {
    language = input.language;
  }

  let theme = current.theme;
  if (isAIThemePreference(input.theme)) {
    theme = input.theme;
  }

  let autoSummary = current.auto_summary;
  if (typeof input.auto_summary === 'boolean') {
    autoSummary = input.auto_summary;
  }

  let recommendationMode = current.recommendation_mode;
  if (isAIRecommendationMode(input.recommendation_mode)) {
    recommendationMode = input.recommendation_mode;
  }

  const next: AIUserSettings = {
    ...current,
    language,
    theme,
    auto_summary: autoSummary,
    recommendation_mode: recommendationMode,
    updated_at: nowIso(),
  };

  storedSettings.set(userId, next);
  return next;
}
