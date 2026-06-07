import type {
  AIAction,
  AIIntent,
  AIReference,
  AISearchHit,
} from '../../types';
import { demoLectures } from '../../data/demo-data';
import { getLectureDetail } from '../../lms/learning';

const STOP_WORDS = new Set([
  '그리고', '하지만', '때문에', '정리', '설명', '강의', '내용', '질문', '답변',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'about', 'into',
]);

export const INTENT_RULES: Array<{
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

export function normalizeText(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function splitSentences(text: string): string[] {
  return normalizeText(text)
    .split(/[.!?]\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function clampConfidence(score: number): number {
  return Math.max(0.35, Math.min(0.98, score));
}

export function buildChunkText(text: string, maxChunks = 3): string[] {
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

export function scoreChunk(queryTokens: string[], candidateText: string, title: string): number {
  if (queryTokens.length === 0) {
    return 0;
  }

  const haystackTokens = tokenize(`${title} ${candidateText}`);
  const overlap = queryTokens.filter((token) => haystackTokens.includes(token)).length;
  const coverage = overlap / Math.max(3, queryTokens.length);
  const exactMatch = normalizeText(candidateText).includes(normalizeText(queryTokens.join(' '))) ? 0.2 : 0;
  return Math.min(0.99, coverage + exactMatch);
}

export function buildIntentEntities(message: string, lectureId?: string): string[] {
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

export function suggestFollowUps(intent: AIIntent, lectureId?: string): string[] {
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

export function buildAnswerFromReference(hits: AISearchHit[], lectureId?: string): string {
  if (hits.length === 0) {
    return lectureId
      ? '강의 근거를 찾지 못했습니다. 질문을 조금 더 구체적으로 바꿔 주세요.'
      : '근거를 찾지 못했습니다. 강의 식별자나 키워드를 더 구체적으로 알려 주세요.';
  }

  const topHit = hits[0];
  if (topHit.similarity < 0.25) {
    return lectureId
      ? '강의 근거와 질문의 연결이 약합니다. 질문을 조금 더 구체적으로 바꿔 주세요.'
      : '근거와 질문의 연결이 약합니다. 강의 식별자나 키워드를 더 구체적으로 알려 주세요.';
  }

  const nextHit = hits[1];
  const lead = topHit.source_type === 'note' ? '요약 노트를 기준으로 보면' : '강의 근거를 기준으로 보면';
  const nextSentence = nextHit ? ` 추가로 ${nextHit.excerpt.slice(0, 80)}.` : '';

  return `${lead}, ${topHit.excerpt}${nextSentence}`.trim();
}

export function rankIntentRules(normalized: string): {
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
  });
  rankedRules.sort((left, right) => right.score - left.score);

  const topRule = rankedRules[0];
  const secondRule = rankedRules[1];

  return {
    topRule,
    secondRule,
    hasAmbiguousMatch: Boolean(topRule && secondRule && topRule.score >= 0.5 && Math.abs(topRule.score - secondRule.score) < 0.1),
  };
}

export function buildIntentReason(
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
