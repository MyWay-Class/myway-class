import type { UserRole } from '../common';

export type AIInsightFeatureStat = {
  feature: string;
  label: string;
  count: number;
  success_rate: number;
  avg_latency_ms: number;
};

export type AIInsightIntentStat = {
  intent: import('./intent').AIIntent | 'unknown';
  label: string;
  count: number;
  success_rate: number;
  avg_confidence: number;
};

export type AIInsightSummary = {
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  unique_users: number;
  recent_window_days: number;
};

export type AIStudentInsight = {
  role: 'STUDENT';
  total_requests: number;
  recent_intents: AIInsightIntentStat[];
  feature_stats: AIInsightFeatureStat[];
  recommended_actions: string[];
};

export type AIInstructorLectureInsight = {
  lecture_id: string;
  lecture_title: string;
  question_count: number;
};

export type AIInstructorInsight = {
  role: 'INSTRUCTOR';
  total_questions: number;
  top_lecture_questions: AIInstructorLectureInsight[];
  feature_stats: AIInsightFeatureStat[];
  intent_stats: AIInsightIntentStat[];
};

export type AIAdminInsight = {
  role: 'ADMIN';
  total_users: number;
  published_courses: number;
  total_enrollments: number;
  ai_usage_7d: number;
  feature_stats: AIInsightFeatureStat[];
  intent_stats: AIInsightIntentStat[];
};

export type AIInsights = {
  role: UserRole;
  summary: AIInsightSummary;
  feature_stats: AIInsightFeatureStat[];
  intent_stats: AIInsightIntentStat[];
  role_insight: AIStudentInsight | AIInstructorInsight | AIAdminInsight;
};
