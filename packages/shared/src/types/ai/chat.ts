import type { MediaSummaryStyle, SimilarChunk } from '../lms';
import type { AIProviderName } from '../../ai/ai-provider';
import type { AIIntent } from './intent';

export type AIChunkSource = 'lecture' | 'transcript' | 'note';

export type AIAction = 'SEARCH' | 'DIRECT_ANSWER' | 'CLARIFY' | 'DECOMPOSE';

export type AIIntentRequest = {
  message: string;
  lecture_id?: string;
  context?: string[];
};

export type AIIntentResult = {
  intent: AIIntent;
  confidence: number;
  action: AIAction;
  entities: string[];
  reason: string;
  needs_clarification: boolean;
  lecture_id: string | null;
};

export type AISearchRequest = {
  query: string;
  lecture_id?: string;
  limit?: number;
};

export type AISearchHit = SimilarChunk & {
  lecture_id: string;
  source_type: AIChunkSource;
  source_id: string;
  title: string;
  excerpt: string;
};

export type AISearchResult = {
  query: string;
  lecture_id: string | null;
  hits: AISearchHit[];
};

export type AIReference = AISearchHit;

export type AIAnswerRequest = {
  question: string;
  lecture_id?: string;
  intent_hint?: AIIntent;
  limit?: number;
};

export type AIAnswerResult = {
  question: string;
  lecture_id: string | null;
  intent: AIIntentResult;
  answer: string;
  references: AIReference[];
  suggestions: string[];
};

export type AIQuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  correct_choice_index: number;
  explanation: string;
  reference: AIReference;
};

export type AIQuizRequest = {
  lecture_id: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type AIQuizResult = {
  lecture_id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: AIQuizQuestion[];
};

export type AISummaryRequest = {
  lecture_id: string;
  style?: MediaSummaryStyle;
  language?: 'ko' | 'en';
};

export type AISummaryResult = {
  lecture_id: string;
  title: string;
  style: MediaSummaryStyle;
  language: string;
  content: string;
  key_points: string[];
  references: AIReference[];
};

export type SmartChatRequest = {
  message: string;
  lecture_id?: string;
  course_id?: string;
  context?: string[];
  language?: 'ko' | 'en';
};

export type SmartChatRoute = 'summary' | 'quiz' | 'search' | 'answer' | 'translate' | 'compare' | 'clarify' | 'general';

export type SmartChatResult = {
  message: string;
  lecture_id: string | null;
  course_id: string | null;
  route: SmartChatRoute;
  intent: AIIntentResult;
  answer: string;
  references: AIReference[];
  suggestions: string[];
  summary?: AISummaryResult | null;
  quiz?: AIQuizResult | null;
  provider?: AIProviderName;
  model?: string;
};
