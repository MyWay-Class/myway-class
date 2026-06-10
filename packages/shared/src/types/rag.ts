import type { AIProviderName } from '../ai/ai-provider';
import type { AIAnswerResult, AIChunkSource, AIIntentResult, AISearchResult } from './ai';
import type { AnswerPolicy } from './transcript';

export type AIRagEntityKind = 'lecture_title' | 'course_title' | 'keyword' | 'quoted_phrase' | 'number' | 'context';

export type AIRagEntitySource = 'query' | 'lecture' | 'course' | 'context';

export type AIRagEntity = {
  value: string;
  label: string;
  kind: AIRagEntityKind;
  source: AIRagEntitySource;
  confidence: number;
};

export type AIRagChunk = AISearchResult['hits'][number] & {
  token_count: number;
  source_scope: AIChunkSource;
  start_ms?: number;
  end_ms?: number;
  retrieval_mode?: 'keyword' | 'hybrid';
  keyword_similarity?: number;
  vector_similarity?: number;
  hybrid_similarity?: number;
  vector_embedding?: number[];
  score_breakdown?: {
    keyword: number;
    vector: number;
    hybrid: number;
  };
};

export type SearchIndexEntry = AIRagChunk;

export type SearchIndex = SearchIndexEntry[];

export type AIRagProviderPlan = {
  preferred_provider: AIProviderName | null;
  intent_provider: AIProviderName;
  search_provider: AIProviderName;
  answer_provider: AIProviderName;
  vector_store_provider: 'feature_store';
  rerank_provider: AIProviderName;
  fallback_chain: AIProviderName[];
};

export type AIRagRequest = {
  query: string;
  lecture_id?: string;
  course_id?: string;
  limit?: number;
  context?: string[];
  preferred_provider?: AIProviderName;
};

export type AIRagResult = {
  query: string;
  lecture_id: string | null;
  course_id: string | null;
  intent: AIIntentResult;
  entities: AIRagEntity[];
  chunks: AIRagChunk[];
  search: AISearchResult;
  answer: AIAnswerResult;
  policy: AnswerPolicy;
  provider: AIRagProviderPlan;
};
