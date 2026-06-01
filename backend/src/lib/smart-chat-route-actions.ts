import type { SmartChatRequest, SmartChatResult, MediaRepository } from '@myway/shared';
import { runAIAnswerWithExecution, runAIQuizWithEngine, runAISummaryWithEngine } from './ai-engine-runners';
import type { RuntimeBindings } from './runtime-env';
import type { SmartChatMetadata } from './smart-chat';

function attachMetadata(result: SmartChatResult, metadata: SmartChatMetadata): SmartChatResult {
  return {
    ...result,
    provider: metadata.provider,
    model: metadata.model,
  };
}

function buildSummarySuggestions(title: string): string[] {
  return [`${title}를 타임라인으로도 요약해줘.`, `${title}의 핵심 키워드를 다시 정리해줘.`];
}

function buildQuizSuggestions(): string[] {
  return ['이 퀴즈의 해설도 보여줘.', '문항 수를 줄여서 다시 만들어줘.'];
}

export async function resolveSummaryRoute(
  input: {
    message: string;
    lectureId: string;
    courseId: string | null;
    language: SmartChatRequest['language'];
    route: SmartChatResult['route'];
    intent: SmartChatResult['intent'];
  },
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<SmartChatResult | null> {
  const summaryExecution = await runAISummaryWithEngine(
    {
      lecture_id: input.lectureId,
      style: 'brief',
      language: input.language ?? 'ko',
    },
    undefined,
    env,
    repository,
  );

  if (!summaryExecution) return null;

  return attachMetadata(
    {
      message: input.message,
      lecture_id: input.lectureId,
      course_id: input.courseId,
      route: input.route,
      intent: input.intent,
      answer: summaryExecution.result.content,
      references: summaryExecution.result.references,
      suggestions: buildSummarySuggestions(summaryExecution.result.title),
      summary: summaryExecution.result,
    },
    {
      provider: summaryExecution.provider,
      model: summaryExecution.model,
    },
  );
}

export async function resolveQuizRoute(
  input: {
    message: string;
    lectureId: string;
    courseId: string | null;
    route: SmartChatResult['route'];
    intent: SmartChatResult['intent'];
  },
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<SmartChatResult | null> {
  const quizExecution = await runAIQuizWithEngine(
    {
      lecture_id: input.lectureId,
      count: 4,
      difficulty: 'medium',
    },
    undefined,
    env,
    repository,
  );

  if (!quizExecution) return null;

  return attachMetadata(
    {
      message: input.message,
      lecture_id: input.lectureId,
      course_id: input.courseId,
      route: input.route,
      intent: input.intent,
      answer: `${quizExecution.result.title}가 생성되었습니다.`,
      references: quizExecution.result.questions.map((question) => question.reference).slice(0, 4),
      suggestions: buildQuizSuggestions(),
      quiz: quizExecution.result,
    },
    {
      provider: quizExecution.provider,
      model: quizExecution.model,
    },
  );
}

export async function resolveAnswerRoute(
  input: {
    message: string;
    lectureId: string | null;
    courseId: string | null;
    route: SmartChatResult['route'];
    intent: SmartChatResult['intent'];
  },
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<SmartChatResult> {
  const answerExecution = await runAIAnswerWithExecution(
    {
      question: input.message,
      lecture_id: input.lectureId ?? undefined,
      limit: 4,
    },
    undefined,
    env,
    repository,
  );

  return attachMetadata(
    {
      message: input.message,
      lecture_id: input.lectureId,
      course_id: input.courseId,
      route: input.route,
      intent: input.intent,
      answer: answerExecution.result.answer,
      references: answerExecution.result.references,
      suggestions: answerExecution.result.suggestions,
    },
    {
      provider: answerExecution.provider,
      model: answerExecution.model,
    },
  );
}
