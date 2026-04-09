export type AIUsageLog = {
  id: string;
  user_id: string | null;
  feature: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  success: number;
  error_message: string | null;
  created_at: string;
};

export type AIIntentLog = {
  id: string;
  user_id: string;
  message: string;
  detected_intent: import('./intent').AIIntent;
  confidence: number;
  feature: string;
  success: boolean;
  action_taken: string;
  lecture_id: string | null;
  course_id: string | null;
  created_at: string;
};

export type AIQuestionLog = {
  id: string;
  user_id: string;
  lecture_id: string;
  course_id: string;
  question: string;
  answer: string;
  model: string;
  success: boolean;
  created_at: string;
};

export type AIUsageGroupStat = {
  key: string;
  label: string;
  count: number;
  success_rate: number;
  avg_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
};

export type AILogSummary = {
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  total_input_tokens: number;
  total_output_tokens: number;
  unique_users: number;
  recent_window_days: number;
  top_provider: string;
  top_model: string;
};

export type AILogOverview = {
  summary: AILogSummary;
  provider_stats: AIUsageGroupStat[];
  model_stats: AIUsageGroupStat[];
  usage_logs: AIUsageLog[];
  intent_logs: AIIntentLog[];
  question_logs: AIQuestionLog[];
};
