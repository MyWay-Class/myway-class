import { demoCourses } from '../data/demo-data';
import { answerAIQuestion, classifyAIIntent, collectLectureReferences, searchAIContent } from './ai-intent';
import { createAISummary, generateAIQuiz } from './ai-learning';
import { getCourseLectures } from '../lms/learning';
import type {
  AIReference,
  AISummaryResult,
  AIQuizResult,
  SmartChatRequest,
  SmartChatResult,
  SmartChatRoute,
} from '../types';

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function getCourseTitle(courseId: string): string {
  return demoCourses.find((course) => course.id === courseId)?.title ?? '알 수 없는 강의';
}

function listCourseLectureIds(courseId: string): string[] {
  return getCourseLectures(courseId).map((lecture) => lecture.id);
}

function collectCourseReferences(courseId: string): AIReference[] {
  return listCourseLectureIds(courseId).flatMap((lectureId) => collectLectureReferences(lectureId));
}

function searchCourseReferences(query: string, courseId: string, limit: number): AIReference[] {
  const hits = listCourseLectureIds(courseId).flatMap((lectureId) => searchAIContent({
    query,
    lecture_id: lectureId,
    limit: Math.max(1, Math.min(2, limit)),
  }).hits);

  const uniqueHits = new Map<string, AIReference>();
  for (const hit of hits) {
    const key = `${hit.source_id}:${hit.chunk_index}`;
    if (!uniqueHits.has(key)) {
      uniqueHits.set(key, hit);
    }
  }

  return Array.from(uniqueHits.values())
    .sort((left, right) => right.similarity - left.similarity || left.title.localeCompare(right.title))
    .slice(0, limit);
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

function buildCourseSummary(courseId: string, language: 'ko' | 'en'): {
  summary: AISummaryResult | null;
  answer: string;
  references: AIReference[];
} {
  const lectureIds = listCourseLectureIds(courseId);
  const summaries = lectureIds
    .slice(0, 3)
    .map((lectureId) => createAISummary({ lecture_id: lectureId, style: 'brief', language }))
    .filter((item): item is AISummaryResult => Boolean(item));

  if (summaries.length === 0) {
    return { summary: null, answer: '요약할 강의를 찾을 수 없습니다.', references: [] };
  }

  return {
    summary: summaries[0],
    answer: buildSummaryFromLectureSummaries(summaries, getCourseTitle(courseId)),
    references: summaries.flatMap((summary) => summary.references).slice(0, 6),
  };
}

function buildCourseQuiz(courseId: string, count?: number): AIQuizResult | null {
  const lectureId = listCourseLectureIds(courseId)[0];
  if (!lectureId) {
    return null;
  }

  return generateAIQuiz({
    lecture_id: lectureId,
    count,
  });
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
      .replace(/(번역|translate|영어로|한국어로|영어|한국어|to english|to korean)/gi, '')
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

function resolveRoute(intent: SmartChatResult['intent']['intent']): SmartChatRoute {
  if (intent === 'request_summary') {
    return 'summary';
  }

  if (intent === 'generate_quiz') {
    return 'quiz';
  }

  if (intent === 'search_content') {
    return 'search';
  }

  if (intent === 'translate') {
    return 'translate';
  }

  if (intent === 'compare') {
    return 'compare';
  }

  if (intent === 'clarify') {
    return 'clarify';
  }

  return 'answer';
}

export function buildSmartChatOverview(input: SmartChatRequest): SmartChatResult {
  const message = normalizeText(input.message);
  const intent = classifyAIIntent({
    message,
    lecture_id: input.lecture_id,
    context: input.context,
  });
  const route = resolveRoute(intent.intent);
  const courseId = input.course_id ?? null;
  const lectureId = input.lecture_id ?? null;
  const language = input.language ?? 'ko';
  const courseTitle = courseId ? getCourseTitle(courseId) : '현재 강의';

  if (route === 'clarify') {
    return {
      message,
      lecture_id: lectureId,
      course_id: courseId,
      route,
      intent,
      answer: '질문의 의도가 여러 가지로 해석됩니다. 요약, 질문응답, 검색, 번역, 비교 중 하나를 더 구체적으로 알려 주세요.',
      references: lectureId ? collectLectureReferences(lectureId) : courseId ? collectCourseReferences(courseId) : [],
      suggestions: ['이 강의를 3줄로 요약해줘.', '이 강의에서 핵심 근거를 찾아줘.', '이 두 개념을 비교해줘.'],
    };
  }

  if (route === 'summary') {
    if (lectureId) {
      const summary = createAISummary({ lecture_id: lectureId, style: 'brief', language });
      return {
        message,
        lecture_id: lectureId,
        course_id: courseId,
        route,
        intent,
        answer: summary?.content ?? '요약할 강의를 찾지 못했습니다.',
        references: summary?.references ?? [],
        suggestions: summary ? [`${summary.title}를 타임라인으로도 요약해줘.`, `${summary.title}의 핵심 키워드를 다시 정리해줘.`] : [],
        summary,
      };
    }

    if (courseId) {
      const courseSummary = buildCourseSummary(courseId, language);
      return {
        message,
        lecture_id: null,
        course_id: courseId,
        route,
        intent,
        answer: courseSummary.answer,
        references: courseSummary.references,
        suggestions: ['다른 강의도 함께 요약해줘.', '이 과목의 핵심 개념만 다시 정리해줘.'],
        summary: courseSummary.summary,
      };
    }
  }

  if (route === 'quiz') {
    if (lectureId) {
      const quiz = generateAIQuiz({ lecture_id: lectureId, count: 4 });
      return {
        message,
        lecture_id: lectureId,
        course_id: courseId,
        route,
        intent,
        answer: quiz ? `${quiz.title}가 생성되었습니다.` : '퀴즈를 생성할 수 없습니다.',
        references: lectureId ? collectLectureReferences(lectureId) : [],
        suggestions: ['이 퀴즈의 해설도 보여줘.', '문항 수를 줄여서 다시 만들어줘.'],
        quiz,
      };
    }

    if (courseId) {
      const quiz = buildCourseQuiz(courseId, 4);
      return {
        message,
        lecture_id: null,
        course_id: courseId,
        route,
        intent,
        answer: quiz ? `${getCourseTitle(courseId)}의 첫 강의 기준 퀴즈를 생성했습니다.` : '퀴즈를 생성할 강의를 찾지 못했습니다.',
        references: quiz ? collectCourseReferences(courseId).slice(0, 4) : [],
        suggestions: ['이 과목의 다른 강의로 퀴즈를 만들어줘.', '오답 해설도 같이 보여줘.'],
        quiz,
      };
    }
  }

  if (route === 'search' || route === 'answer') {
    const searchQuery = intent.intent === 'search_content'
      ? message
      : input.context?.[0] ?? message;

    const hits = courseId
      ? searchCourseReferences(searchQuery, courseId, 4)
      : searchAIContent({
          query: searchQuery,
          lecture_id: lectureId ?? undefined,
          limit: 4,
        }).hits;

    const answer = route === 'search'
      ? buildSearchAnswer(hits, searchQuery, courseId ? `${courseTitle}` : lectureId ? '강의' : '전체 강의')
      : answerAIQuestion({
          question: message,
          lecture_id: lectureId ?? undefined,
          limit: 4,
        }).answer;

    return {
      message,
      lecture_id: lectureId,
      course_id: courseId,
      route,
      intent,
      answer,
      references: hits,
      suggestions: intent.intent === 'search_content'
        ? ['관련 근거를 더 찾아줘.', '이 내용의 핵심만 다시 알려줘.']
        : ['같은 주제를 더 자세히 설명해줘.', '다른 강의와 비교해줘.'],
    };
  }

  if (route === 'translate') {
    const targetLanguage = extractTranslationTarget(message, language);
    const answer = buildTranslationAnswer(message, targetLanguage);

    return {
      message,
      lecture_id: lectureId,
      course_id: courseId,
      route,
      intent,
      answer,
      references: lectureId ? collectLectureReferences(lectureId) : courseId ? collectCourseReferences(courseId) : [],
      suggestions: ['다른 문장도 번역해줘.', '원문 기준으로 다시 풀어줘.'],
    };
  }

  if (route === 'compare') {
    const hits = courseId
      ? searchCourseReferences(message, courseId, 2)
      : searchAIContent({
          query: message,
          lecture_id: lectureId ?? undefined,
          limit: 2,
        }).hits;

    return {
      message,
      lecture_id: lectureId,
      course_id: courseId,
      route,
      intent,
      answer: buildComparisonAnswer(hits, courseId ? courseTitle : lectureId ? '강의' : '전체 강의'),
      references: hits,
      suggestions: ['차이점을 표로 다시 정리해줘.', '공통점만 다시 보여줘.'],
    };
  }

  const fallback = answerAIQuestion({
    question: message,
    lecture_id: lectureId ?? undefined,
    limit: 3,
  });

  return {
    message,
    lecture_id: lectureId,
    course_id: courseId,
    route: 'general',
    intent,
    answer: fallback.answer,
    references: fallback.references,
    suggestions: fallback.suggestions,
  };
}
