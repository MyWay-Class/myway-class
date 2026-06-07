import { demoCourses } from '../../data/demo-data';
import { getCourseLectures } from '../../lms/learning';
import { createAISummary, generateAIQuiz } from '../ai-learning';
import { collectLectureReferences } from '../intent/corpus';
import { memoryMediaRepository, type MediaRepository } from '../../lms/media';
import { normalizeText as normalizeIntentText, scoreChunk, tokenize } from '../intent/helpers';
import type {
  AIReference,
  AISummaryResult,
  AIQuizResult,
  SmartChatRoute,
} from '../../types';

function normalizeText(text: string): string {
  return normalizeIntentText(text);
}

function getCourseTitle(courseId: string): string {
  return demoCourses.find((course) => course.id === courseId)?.title ?? '알 수 없는 강의';
}

function listCourseLectureIds(courseId: string): string[] {
  return getCourseLectures(courseId).map((lecture) => lecture.id);
}

async function collectCourseReferences(courseId: string, repository: MediaRepository = memoryMediaRepository): Promise<AIReference[]> {
  return Promise.all(listCourseLectureIds(courseId).map((lectureId) => collectLectureReferences(lectureId, repository))).then((items) => items.flat());
}

async function searchCourseReferences(query: string, courseId: string, limit: number, repository: MediaRepository = memoryMediaRepository): Promise<AIReference[]> {
  const queryTokens = tokenize(query);
  const hits = await Promise.all(
    listCourseLectureIds(courseId).map(async (lectureId) =>
      (await collectLectureReferences(lectureId, repository)).map((reference) => ({
        ...reference,
        similarity: scoreChunk(queryTokens, reference.excerpt, reference.title),
      })),
    ),
  ).then((items) => items.flat());

  const uniqueHits = new Map<string, AIReference>();
  for (const hit of hits) {
    const key = `${hit.source_id}:${hit.chunk_index}`;
    if (!uniqueHits.has(key)) {
      uniqueHits.set(key, hit);
    }
  }

  const rankedHits = Array.from(uniqueHits.values());
  rankedHits.sort((left, right) => right.similarity - left.similarity || left.title.localeCompare(right.title));
  return rankedHits.slice(0, limit);
}

function buildSearchAnswer(hits: AIReference[], query: string, label: string): string {
  if (hits.length === 0) {
    return `${label}에서 "${query}"와 관련된 근거를 찾지 못했습니다. 질문을 조금 더 구체적으로 바꿔 주세요.`;
  }

  const topHit = hits[0];
  const nextHit = hits[1];
  const nextText = nextHit ? ` 추가로 ${nextHit.excerpt.slice(0, 80)}.` : '';
  return `${label}를 기준으로 보면, ${topHit.excerpt}${nextText}`.trim();
}

function buildSummaryFromLectureSummaries(summaries: AISummaryResult[], courseTitle: string): string {
  if (summaries.length === 0) {
    return `${courseTitle}에서 요약할 강의를 찾지 못했습니다.`;
  }

  const lines = summaries.map((summary, index) => `${index + 1}. ${summary.title}\n${summary.content}`);
  return `${courseTitle}의 강의 흐름을 묶어 보면 다음과 같습니다.\n\n${lines.join('\n\n')}`;
}

async function buildCourseSummary(courseId: string, language: 'ko' | 'en', repository: MediaRepository = memoryMediaRepository): Promise<{
  summary: AISummaryResult | null;
  answer: string;
  references: AIReference[];
}> {
  const lectureIds = listCourseLectureIds(courseId);
  const summaries = (await Promise.all(
      lectureIds
      .slice(0, 3)
      .map((lectureId) => createAISummary({ lecture_id: lectureId, style: 'brief', language }, repository)),
  )).filter((item): item is AISummaryResult => Boolean(item));

  if (summaries.length === 0) {
    return { summary: null, answer: '요약할 강의를 찾을 수 없습니다.', references: [] };
  }

  return {
    summary: summaries[0],
    answer: buildSummaryFromLectureSummaries(summaries, getCourseTitle(courseId)),
    references: summaries.flatMap((summary) => summary.references).slice(0, 6),
  };
}

async function buildCourseQuiz(courseId: string, count?: number, repository: MediaRepository = memoryMediaRepository): Promise<AIQuizResult | null> {
  const lectureId = listCourseLectureIds(courseId)[0];
  if (!lectureId) {
    return null;
  }

  return await generateAIQuiz({
    lecture_id: lectureId,
    count,
  }, repository);
}

function extractTranslationTarget(message: string, language?: 'ko' | 'en'): 'ko' | 'en' {
  if (language) {
    return language;
  }

  const normalized = normalizeText(message);
  if (/영어|english|translate to english/i.test(normalized)) {
    return 'en';
  }

  return 'ko';
}

function buildTranslationAnswer(message: string, targetLanguage: 'ko' | 'en'): string {
  const cleanText = normalizeText(
    message
      .replaceAll(/(번역|translate|영어로|한국어로|영어|한국어|to english|to korean)/gi, '')
      .trim(),
  );

  if (!cleanText) {
    return '번역할 문장을 찾지 못했습니다.';
  }

  if (targetLanguage === 'en') {
    return `English translation: ${cleanText}`;
  }

  return `한국어 번역: ${cleanText}`;
}

function buildComparisonAnswer(hits: AIReference[], label: string): string {
  if (hits.length < 2) {
    return `${label}에서 비교할 근거를 충분히 찾지 못했습니다. 다른 표현으로 다시 질문해 주세요.`;
  }

  const [left, right] = hits;
  return [
    `${label} 비교 결과`,
    '',
    `1. ${left.title}`,
    `- ${left.excerpt.slice(0, 140)}`,
    '',
    `2. ${right.title}`,
    `- ${right.excerpt.slice(0, 140)}`,
    '',
    '공통점: 두 항목 모두 강의 근거를 기반으로 설명됩니다.',
    '차이점: 첫 번째 항목은 더 직접적인 근거를, 두 번째 항목은 보조 설명을 제공합니다.',
  ].join('\n');
}

function resolveRoute(intent: import('../../types').SmartChatResult['intent']['intent']): SmartChatRoute {
  if (intent === 'request_summary') return 'summary';
  if (intent === 'generate_quiz') return 'quiz';
  if (intent === 'search_content') return 'search';
  if (intent === 'translate') return 'translate';
  if (intent === 'compare') return 'compare';
  if (intent === 'clarify') return 'clarify';
  return 'answer';
}

export {
  buildComparisonAnswer,
  buildCourseQuiz,
  buildCourseSummary,
  buildSearchAnswer,
  buildSummaryFromLectureSummaries,
  collectCourseReferences,
  extractTranslationTarget,
  getCourseTitle,
  listCourseLectureIds,
  normalizeText,
  resolveRoute,
  searchCourseReferences,
  buildTranslationAnswer,
};
