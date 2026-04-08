import { createAISummary } from '../ai-learning';
import type {
  AIAction,
  AIAnswerRequest,
  AIAnswerResult,
  AIIntent,
  AIIntentRequest,
  AIIntentResult,
  AISearchRequest,
  AISearchResult,
} from '../../types';
import {
  buildAnswerFromReference,
  buildIntentEntities,
  buildIntentReason,
  clampConfidence,
  normalizeText,
  rankIntentRules,
  scoreChunk,
  suggestFollowUps,
  tokenize,
} from './helpers';
import { buildSearchCandidates } from './corpus';

function buildSearchResult(query: string, lectureId: string | null, hits: AISearchResult['hits']): AISearchResult {
  return {
    query,
    lecture_id: lectureId,
    hits,
  };
}

function scoreCandidates(query: string, hits: AISearchResult['hits'], limit: number): AISearchResult['hits'] {
  const queryTokens = tokenize(query);
  const rankedHits = hits
    .map((reference) => ({
      ...reference,
      similarity: scoreChunk(queryTokens, reference.excerpt, reference.title),
    }))
    .filter((hit) => hit.similarity > 0 || queryTokens.length === 0);
  rankedHits.sort((left, right) => right.similarity - left.similarity || left.title.localeCompare(right.title));
  return rankedHits.slice(0, limit);
}

export function classifyAIIntent(input: AIIntentRequest): AIIntentResult {
  const normalized = normalizeText(input.message);
  const { topRule, hasAmbiguousMatch } = rankIntentRules(normalized);
  const fallbackIntent: AIIntent = normalized.includes('?') ? 'ask_concept' : 'general_chat';
  const intent = hasAmbiguousMatch ? 'clarify' : topRule?.intent ?? fallbackIntent;
  const baseScore = topRule?.score ?? (intent === 'general_chat' ? 0.42 : 0.5);
  const confidence = clampConfidence(baseScore + (input.lecture_id ? 0.05 : 0));
  const needsClarification = intent === 'clarify' || confidence < 0.6;
  let action: AIAction = 'DIRECT_ANSWER';
  if (hasAmbiguousMatch) {
    action = 'CLARIFY';
  } else if (topRule?.action) {
    action = topRule.action;
  } else if (needsClarification) {
    action = 'CLARIFY';
  }

  return {
    intent,
    confidence,
    action,
    entities: buildIntentEntities(input.message, input.lecture_id),
    reason: buildIntentReason(normalized, topRule, hasAmbiguousMatch),
    needs_clarification: needsClarification,
    lecture_id: input.lecture_id ?? null,
  };
}

export function searchAIContent(input: AISearchRequest): AISearchResult {
  const query = normalizeText(input.query);
  const limit = Math.max(1, Math.min(5, input.limit ?? 3));
  const hits = scoreCandidates(query, buildSearchCandidates(input.lecture_id), limit);

  return buildSearchResult(query, input.lecture_id ?? null, hits);
}

export function answerAIQuestion(input: AIAnswerRequest): AIAnswerResult {
  const intent = classifyAIIntent({
    message: input.question,
    lecture_id: input.lecture_id,
  });
  const search = searchAIContent({
    query: input.question,
    lecture_id: input.lecture_id,
    limit: input.limit ?? 3,
  });
  const references = search.hits;
  let summary = buildAnswerFromReference(references, input.lecture_id);
  const shouldSummarize = input.intent_hint === 'request_summary' || intent.intent === 'request_summary';
  if (shouldSummarize && input.lecture_id) {
    summary =
      createAISummary({
        lecture_id: input.lecture_id,
        style: 'brief',
        language: 'ko',
      })?.content ?? summary;
  }

  return {
    question: input.question,
    lecture_id: input.lecture_id ?? null,
    intent,
    answer: summary,
    references,
    suggestions: suggestFollowUps(intent.intent, input.lecture_id),
  };
}

export { collectLectureReferences } from './corpus';
