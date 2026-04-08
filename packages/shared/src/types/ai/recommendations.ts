import type { CourseDifficulty, UserRole } from '../common';

export type AIThemePreference = 'light' | 'dark' | 'system';

export type AIRecommendationMode = 'progress' | 'discovery' | 'balanced';

export type AIRecommendationSource = 'progress' | 'discovery' | 'review' | 'management';

export type AIUserSettings = {
  user_id: string;
  language: 'ko' | 'en';
  theme: AIThemePreference;
  auto_summary: boolean;
  recommendation_mode: AIRecommendationMode;
  updated_at: string;
};

export type AIUserSettingsUpdateRequest = {
  language?: 'ko' | 'en';
  theme?: AIThemePreference;
  auto_summary?: boolean;
  recommendation_mode?: AIRecommendationMode;
};

export type AIRecommendationCard = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CourseDifficulty;
  instructor_name: string;
  progress_percent: number;
  reason: string;
  score: number;
  is_enrolled: boolean;
  source: AIRecommendationSource;
  tags: string[];
};

export type AIRecommendationOverview = {
  user_id: string;
  role: UserRole;
  settings: AIUserSettings;
  recommendations: AIRecommendationCard[];
  suggested_actions: string[];
  updated_at: string;
};
