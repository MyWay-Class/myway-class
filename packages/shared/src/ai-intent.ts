import { demoLectures } from './demo-data';
import { getLectureDetail } from './learning';
import { getLectureTranscript, listLectureNotes } from './media';
import { createAISummary } from './ai-learning';
import type {
  AIAction,
  AIAnswerRequest,
  AIAnswerResult,
  AIChunkSource,
  AIIntent,
  AIIntentRequest,
  AIIntentResult,
  AIReference,
  AISearchHit,
  AISearchRequest,
  AISearchResult,
} from './types';

const STOP_WORDS = new Set([
  '그리고', '하지만', '때문에', '정리', '설명', '강의', '내용', '질문', '답변',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'about', 'into',
]);

const INTENT_RULES: Array<{
  intent: AIIntent;
  action: AIAction;
  keywords: string[];
}> = [
  { intent: 'request_summary', action: 'DIRECT_ANSWER', keywords: ['요약', '정리', '핵심', 'summary'] },
  { intent: 'generate_quiz', action: 'DECOMPOSE', keywords: ['퀴즈', '문제', '문항', '플래시카드', 'flashcard'] },
  { intent: 'search_content', action: 'SEARCH', keywords: ['검색', '찾', '어디', '근거', '검색해', 'search'] },
  { intent: 'ask_concept', action: 'DIRECT_ANSWER', keywords: ['무엇', '뭐', '왜', '어떻게', '설명', '알려줘'] },
  { intent: 'ask_recommendation', action: 'SEARCH', keywords: ['추천', '무슨', '어떤 강의', '골라', 'recommend'] },
  { intent: 'explain_deeper', action: 'DIRECT_ANSWER', keywords: ['자세히', '깊게', '더 설명', '왜 그런지'] },
  { intent: 'translate', action: 'DIRECT_ANSWER', keywords: ['번역', 'translate'] },
  { intent: 'compare', action: 'DECOMPOSE', keywords: ['비교', '차이', '다른 점'] },
  { intent: 'create_shortform', action: 'DECOMPOSE', keywords: ['숏폼', 'shortform', '클립'] },
  { intent: 'extract_audio', action: 'DIRECT_ANSWER', keywords: ['오디오', '음성 추출', 'extract audio'] },
  { intent: 'analyze_progress', action: 'DIRECT_ANSWER', keywords: ['진도', '진행', '수강 현황', 'progress'] },
];

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function splitSentences(text: string): string[] {
  return normalizeText(text)
    .split(/[.!?]\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function clampConfidence(score: number): number {
  return Math.max(0.35, Math.min(0.98, score));
}

function createReference(
  lectureId: string,
  sourceType: AIChunkSource,
  sourceId: string,
  title: string,
  excerpt: string,
  chunkIndex: number,
  similarity: number,
): AIReference {
  return {
    id: `${sourceType}_${sourceId}_${String(chunkIndex + 1).padStart(2, '0')}`,
    lecture_id: lectureId,
    source_type: sourceType,
    source_id: sourceId,
    title,
    content: excerpt.slice(0, 240),
    excerpt: excerpt.slice(0, 240),
    similarity,
    chunk_index: chunkIndex,
  };
}

function buildChunkText(text: string, maxChunks = 3): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return [];
  }

  const chunkSize = Math.max(1, Math.ceil(sentences.length / maxChunks));
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    chunks.push(sentences.slice(index, index + chunkSize).join(' '));
  }

  return chunks;
}

function scoreChunk(queryTokens: string[], candidateText: string, title: string): number {
  if (queryTokens.length === 0) {
    return 0;
  }

  const haystackTokens = tokenize(`${title} ${candidateText}`);
  const overlap = queryTokens.filter((token) => haystackTokens.includes(token)).length;
  const coverage = overlap / Math.max(3, queryTokens.length);
  const exactMatch = normalizeText(candidateText).includes(normalizeText(queryTokens.join(' '))) ? 0.2 : 0;
  return Math.min(0.99, coverage + exactMatch);
}

export function collectLectureReferences(lectureId: string): AIReference[] {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return [];
  }

  const references: AIReference[] = [];
  const lectureChunks = buildChunkText(`${lecture.title}. ${lecture.content_text}`, 2);

  lectureChunks.forEach((chunk, index) => {
    references.push(
      createReference(
        lecture.id,
        'lecture',
        lecture.id,
        `${lecture.course_title} · ${lecture.title} · 강의 본문`,
        chunk,
        index,
        0.82 - index * 0.05,
      ),
    );
  });

  const transcript = getLectureTranscript(lecture.id);
  transcript?.segments.slice(0, 2).forEach((segment, index) => {
    references.push(
      createReference(
        lecture.id,
        'transcript',
        transcript.id,
        `${lecture.title} · 트랜스크립트`,
        segment.text,
        index,
        0.9 - index * 0.05,
      ),
    );
  });

  const note = listLectureNotes(lecture.id)[0];
  if (note) {
    const noteChunks = buildChunkText(`${note.title}. ${note.content}`, 2);
    noteChunks.slice(0, 2).forEach((chunk, index) => {
      references.push(
        createReference(
          lecture.id,
          'note',
          note.id,
          `${lecture.title} · 요약 노트`,
          chunk,
          index,
          0.88 - index * 0.05,
        ),
      );
    });
  }

  return references;
}

function listTargetLectureIds(lectureId?: string): string[] {
  if (lectureId) {
    return [lectureId];
  }

  return demoLectures.map((lecture) => lecture.id);
}

function buildSearchCandidates(lectureId?: string): AISearchHit[] {
  return listTargetLectureIds(lectureId).flatMap((id) => collectLectureReferences(id));
}

function buildIntentEntities(message: string, lectureId?: string): string[] {
  const entities = new Set<string>();
  const normalizedMessage = normalizeText(message);

  if (lectureId) {
    const lecture = getLectureDetail(lectureId);
    if (lecture) {
      entities.add(lecture.title);
      entities.add(lecture.course_title);
    }
  }

  for (const lecture of demoLectures) {
    if (normalizedMessage.includes(normalizeText(lecture.title))) {
      entities.add(lecture.title);
    }
  }

  tokenize(normalizedMessage).slice(0, 5).forEach((token) => entities.add(token));
  return Array.from(entities).slice(0, 6);
}

function suggestFollowUps(intent: AIIntent, lectureId?: string): string[] {
  const lecture = lectureId ? getLectureDetail(lectureId) : undefined;
  const lectureTitle = lecture?.title ?? '이 강의';

  if (intent === 'request_summary') {
    return [`${lectureTitle}의 핵심만 3줄로 다시 정리해줘.`, `${lectureTitle}의 타임라인 요약도 보여줘.`];
  }

  if (intent === 'generate_quiz') {
    return [`${lectureTitle} 기준으로 객관식 3문제를 다시 만들어줘.`, `${lectureTitle}의 오답 해설도 함께 보여줘.`];
  }

  if (intent === 'search_content') {
    return [`${lectureTitle}에서 관련 근거를 더 찾아줘.`, `질문을 더 구체적으로 바꿔서 다시 물어볼게.`];
  }

  return [`${lectureTitle}의 관련 근거를 더 보여줘.`, `같은 주제를 짧게 다시 설명해줘.`];
}

function buildAnswerFromReference(hits: AISearchHit[], lectureId?: string): string {
  if (hits.length === 0) {
    return lectureId
      ? '강의 근거를 찾지 못했습니다. 질문을 조금 더 구체적으로 바꿔 주세요.'
      : '근거를 찾지 못했습니다. 강의 식별자나 키워드를 더 구체적으로 알려 주세요.';
  }

  const topHit = hits[0];
  const nextHit = hits[1];
  const lead = topHit.source_type === 'note' ? '요약 노트를 기준으로 보면' : '강의 근거를 기준으로 보면';
  const nextSentence = nextHit ? ` 추가로 ${nextHit.excerpt.slice(0, 80)}.` : '';

  return `${lead}, ${topHit.excerpt}${nextSentence}`.trim();
}

function rankIntentRules(normalized: string): {
  topRule?: (typeof INTENT_RULES)[number] & { matchedKeywords: string[]; score: number };
  secondRule?: (typeof INTENT_RULES)[number] & { matchedKeywords: string[]; score: number };
  hasAmbiguousMatch: boolean;
} {
  const rankedRules = INTENT_RULES.map((rule) => {
    const matchedKeywords = rule.keywords.filter((keyword) => normalized.includes(keyword));
    return {
      ...rule,
      matchedKeywords,
      score: matchedKeywords.length * 0.2 + (matchedKeywords.length > 0 ? 0.45 : 0),
    };
  }).sort((left, right) => right.score - left.score);

  const topRule = rankedRules[0];
  const secondRule = rankedRules[1];

  return {
    topRule,
    secondRule,
    hasAmbiguousMatch: Boolean(topRule && secondRule && topRule.score >= 0.5 && Math.abs(topRule.score - secondRule.score) < 0.1),
  };
}

function buildIntentReason(
  normalized: string,
  topRule: (typeof INTENT_RULES)[number] & { matchedKeywords: string[]; score: number } | undefined,
  hasAmbiguousMatch: boolean,
): string {
  if (hasAmbiguousMatch) {
    return '요청 의도가 여러 개로 해석되어 확인이 필요합니다.';
  }

  if (topRule) {
    const matchedKeywords = topRule.keywords.filter((keyword) => normalized.includes(keyword));
    return `${matchedKeywords.join(', ')} 키워드가 감지되었습니다.`;
  }

  return '명확한 의도 키워드가 없어 일반 질문으로 해석했습니다.';
}

export function classifyAIIntent(input: AIIntentRequest): AIIntentResult {
  const normalized = normalizeText(input.message);
  const { topRule, hasAmbiguousMatch } = rankIntentRules(normalized);
  const fallbackIntent: AIIntent = normalized.includes('?') ? 'ask_concept' : 'general_chat';
  const intent = hasAmbiguousMatch ? 'clarify' : topRule?.intent ?? fallbackIntent;
  const baseScore = topRule?.score ?? (intent === 'general_chat' ? 0.42 : 0.5);
  const confidence = clampConfidence(baseScore + (input.lecture_id ? 0.05 : 0));
  const needsClarification = intent === 'clarify' || confidence < 0.6;
  const action: AIAction = hasAmbiguousMatch ? 'CLARIFY' : topRule?.action ?? (needsClarification ? 'CLARIFY' : 'DIRECT_ANSWER');

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
  const queryTokens = tokenize(query);
  const limit = Math.max(1, Math.min(5, input.limit ?? 3));
  const hits = buildSearchCandidates(input.lecture_id)
    .map((reference) => ({
      ...reference,
      similarity: scoreChunk(queryTokens, reference.excerpt, reference.title),
    }))
    .filter((hit) => hit.similarity > 0 || queryTokens.length === 0)
    .sort((left, right) => right.similarity - left.similarity || left.title.localeCompare(right.title))
    .slice(0, limit);

  return {
    query,
    lecture_id: input.lecture_id ?? null,
    hits,
  };
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
  const summary = input.intent_hint === 'request_summary' || intent.intent === 'request_summary'
    ? input.lecture_id
      ? createAISummary({
          lecture_id: input.lecture_id,
          style: 'brief',
          language: 'ko',
        })?.content ?? buildAnswerFromReference(references, input.lecture_id)
      : buildAnswerFromReference(references, input.lecture_id)
    : buildAnswerFromReference(references, input.lecture_id);

  return {
    question: input.question,
    lecture_id: input.lecture_id ?? null,
    intent,
    answer: summary,
    references,
    suggestions: suggestFollowUps(intent.intent, input.lecture_id),
  };
}
