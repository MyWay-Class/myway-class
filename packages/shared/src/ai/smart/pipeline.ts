import { answerAIQuestion, classifyAIIntent } from '../intent/pipeline';
import { collectLectureReferences } from '../intent/corpus';
import { createAISummary, generateAIQuiz } from '../ai-learning';
import type {
  SmartChatRequest,
  SmartChatResult,
} from '../../types';
import {
  buildComparisonAnswer,
  buildCourseQuiz,
  buildCourseSummary,
  buildSearchAnswer,
  buildTranslationAnswer,
  collectCourseReferences,
  extractTranslationTarget,
  getCourseTitle,
  resolveRoute,
  searchCourseReferences,
  normalizeText,
} from './helpers';

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
      : answerAIQuestion({
          question: searchQuery,
          lecture_id: lectureId ?? undefined,
          limit: 4,
        }).references;

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
      : answerAIQuestion({
          question: message,
          lecture_id: lectureId ?? undefined,
          limit: 2,
        }).references;

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
