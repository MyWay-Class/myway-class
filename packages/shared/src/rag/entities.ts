import { demoCourses } from '../data/demo-data';
import { getLectureDetail } from '../lms/learning';
import { classifyAIIntent } from '../ai/ai-intent';
import type {
  AIIntent,
  AIRagEntity,
  AIRagEntityKind,
  AIRagProviderPlan,
  AIRagRequest,
} from '../types';

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function labelEntity(kind: AIRagEntityKind): string {
  switch (kind) {
    case 'lecture_title':
      return '강의 제목';
    case 'course_title':
      return '과목명';
    case 'quoted_phrase':
      return '인용 구문';
    case 'number':
      return '숫자';
    case 'context':
      return '맥락';
    default:
      return '키워드';
  }
}

function addEntity(
  entities: AIRagEntity[],
  seen: Set<string>,
  value: string,
  kind: AIRagEntityKind,
  source: AIRagEntity['source'],
  confidence: number,
): void {
  const cleanValue = normalizeText(value);
  if (!cleanValue) {
    return;
  }

  const key = `${kind}:${source}:${cleanValue.toLowerCase()}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  entities.push({
    value: cleanValue,
    label: labelEntity(kind),
    kind,
    source,
    confidence: Math.max(0.35, Math.min(0.99, confidence)),
  });
}

export function extractEntities(input: AIRagRequest): AIRagEntity[] {
  const entities: AIRagEntity[] = [];
  const seen = new Set<string>();
  const normalized = normalizeText(input.query);

  if (input.lecture_id) {
    const lecture = getLectureDetail(input.lecture_id);
    if (lecture) {
      addEntity(entities, seen, lecture.title, 'lecture_title', 'lecture', 0.98);
      addEntity(entities, seen, lecture.course_title, 'course_title', 'lecture', 0.94);
    }
  }

  if (input.course_id) {
    const course = demoCourses.find((item) => item.id === input.course_id);
    if (course) {
      addEntity(entities, seen, course.title, 'course_title', 'course', 0.96);
    }
  }

  for (const match of normalized.matchAll(/["'“”‘’]([^"'“”‘’]{2,})["'“”‘’]/g)) {
    addEntity(entities, seen, match[1], 'quoted_phrase', 'query', 0.9);
  }

  for (const token of tokenize(normalized).slice(0, 6)) {
    addEntity(entities, seen, token, 'keyword', 'query', 0.65);
  }

  for (const numeric of normalized.match(/\b\d+(?:\.\d+)?\b/g) ?? []) {
    addEntity(entities, seen, numeric, 'number', 'query', 0.72);
  }

  for (const item of input.context ?? []) {
    addEntity(entities, seen, item, 'context', 'context', 0.7);
  }

  return entities.slice(0, 8);
}

export function buildSuggestions(intent: AIIntent, label: string): string[] {
  if (intent === 'request_summary') {
    return [`${label}의 핵심만 3줄로 다시 정리해줘.`, `${label}의 타임라인으로도 보여줘.`];
  }

  if (intent === 'generate_quiz') {
    return [`${label} 기준으로 객관식 3문제를 만들어줘.`, `${label}의 오답 해설도 함께 보여줘.`];
  }

  if (intent === 'search_content') {
    return [`${label}에서 이 주제의 근거를 더 찾아줘.`, `다른 표현으로 다시 검색해줘.`];
  }

  return [`${label}를 다른 각도에서 설명해줘.`, `같은 주제를 더 자세히 보여줘.`];
}

export function buildAnswerText(
  query: string,
  intent: AIIntent,
  hits: { excerpt: string; title: string; similarity: number }[],
  label: string,
): string {
  if (hits.length === 0) {
    return `${label}에서 "${query}"와 관련된 근거를 찾지 못했습니다. 질문을 조금 더 구체적으로 바꿔 주세요.`;
  }

  const topHit = hits[0];
  const nextHit = hits[1];
  const opener =
    intent === 'request_summary'
      ? '요약 근거를 기준으로 보면'
      : intent === 'generate_quiz'
        ? '퀴즈 근거를 기준으로 보면'
        : intent === 'search_content'
          ? '검색 근거를 기준으로 보면'
          : '강의 근거를 기준으로 보면';

  const nextSentence = nextHit ? ` 추가 근거로 ${nextHit.excerpt.slice(0, 100)}.` : '';
  return `${opener}, ${topHit.excerpt}${nextSentence}`.trim();
}

const DEFAULT_FALLBACK_ORDER: Record<'intent' | 'search' | 'answer', AIRagProviderPlan['fallback_chain']> = {
  intent: ['ollama', 'gemini', 'cloudflare', 'demo'],
  search: ['ollama', 'gemini', 'cloudflare', 'demo'],
  answer: ['ollama', 'gemini', 'cloudflare', 'demo'],
};

function uniqueProviders(chain: AIRagProviderPlan['fallback_chain']): AIRagProviderPlan['fallback_chain'] {
  return Array.from(new Set(chain)) as AIRagProviderPlan['fallback_chain'];
}

export function buildProviderPlan(preferredProvider?: AIRagRequest['preferred_provider']): AIRagProviderPlan {
  const fallback_chain = uniqueProviders([
    ...(preferredProvider ? [preferredProvider] : []),
    ...DEFAULT_FALLBACK_ORDER.search,
  ]);

  return {
    preferred_provider: preferredProvider ?? null,
    intent_provider: preferredProvider ?? 'ollama',
    search_provider: preferredProvider ?? 'ollama',
    answer_provider: preferredProvider ?? 'ollama',
    fallback_chain,
  };
}

export function buildIntentOverview(input: AIRagRequest): ReturnType<typeof classifyAIIntent> {
  return classifyAIIntent({
    message: normalizeText(input.query),
    lecture_id: input.lecture_id,
    context: input.context,
  });
}
