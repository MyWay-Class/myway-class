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
