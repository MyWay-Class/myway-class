import {
  buildSmartChatOverview,
  type AIProviderName,
  type SmartChatRequest,
  type SmartChatResult,
  type SmartChatRoute,
  type MediaRepository,
} from '@myway/shared';
import { runAIAnswerWithExecution, runAIIntentWithExecution, runAIQuizWithEngine, runAISummaryWithEngine } from './ai-engine-runners';
import { getAIRuntimePolicy, type RuntimeBindings } from './runtime-env';

type SmartChatMetadata = {
  provider: AIProviderName;
  model: string;
};

const DEMO_SMART_MODEL = 'demo-smart-v1';

function logSmartChatTiming(stage: string, startedAt: number, details: Record<string, unknown>): void {
  const elapsedMs = Math.round(performance.now() - startedAt);
  console.info('[smart-chat]', JSON.stringify({ stage, elapsed_ms: elapsedMs, ...details }));
}

function normalizeRoute(intent: SmartChatResult['intent']['intent']): SmartChatRoute {
  if (intent === 'request_summary') return 'summary';
  if (intent === 'generate_quiz') return 'quiz';
  if (intent === 'search_content') return 'search';
  if (intent === 'translate') return 'translate';
  if (intent === 'compare') return 'compare';
  if (intent === 'clarify') return 'clarify';
  return 'answer';
}

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

export async function runSmartChat(
  input: SmartChatRequest,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<SmartChatResult> {
  const startedAt = performance.now();
  const message = input.message.trim();
  const lectureId = input.lecture_id?.trim() ?? null;
  const courseId = input.course_id?.trim() ?? null;
  const normalizedInput: SmartChatRequest = {
    ...input,
    message,
    lecture_id: lectureId ?? undefined,
    course_id: courseId ?? undefined,
  };
  const policy = getAIRuntimePolicy(env);

  const fallbackStartedAt = performance.now();
  const baseFallback = await buildSmartChatOverview(normalizedInput);
  logSmartChatTiming('base_fallback', fallbackStartedAt, {
    route: baseFallback.route,
    intent: baseFallback.intent.intent,
    lecture_id: lectureId,
    course_id: courseId,
  });

  if (policy.public_mode === 'dev') {
    logSmartChatTiming('complete', startedAt, {
      mode: 'dev',
      route: baseFallback.route,
      intent: baseFallback.intent.intent,
      provider: 'demo',
      model: DEMO_SMART_MODEL,
    });

    return attachMetadata(
      {
        ...baseFallback,
        message,
        lecture_id: lectureId,
        course_id: courseId,
        route: baseFallback.route,
        intent: baseFallback.intent,
      },
      {
        provider: 'demo',
        model: DEMO_SMART_MODEL,
      },
    );
  }

  const intentStartedAt = performance.now();
  const intentExecution = await runAIIntentWithExecution(
    {
      message,
      lecture_id: lectureId ?? undefined,
      context: input.context,
    },
    undefined,
    env,
  );
  logSmartChatTiming('intent', intentStartedAt, {
    provider: intentExecution.provider,
    model: intentExecution.model,
    intent: intentExecution.result.intent,
    route: normalizeRoute(intentExecution.result.intent),
  });

  const route = normalizeRoute(intentExecution.result.intent);
  const sharedResult = attachMetadata(
    {
      ...baseFallback,
      message,
      lecture_id: lectureId,
      course_id: courseId,
      route,
      intent: intentExecution.result,
    },
    {
      provider: intentExecution.provider,
      model: intentExecution.model,
    },
  );

  if (route === 'summary' && lectureId) {
    const summaryStartedAt = performance.now();
    const summaryExecution = await runAISummaryWithEngine(
      {
        lecture_id: lectureId,
        style: 'brief',
        language: input.language ?? 'ko',
      },
      undefined,
      env,
      repository,
    );
    logSmartChatTiming('summary', summaryStartedAt, {
      provider: summaryExecution?.provider ?? 'demo',
      model: summaryExecution?.model ?? 'demo-summary-v1',
      has_result: Boolean(summaryExecution),
    });

    if (summaryExecution) {
      logSmartChatTiming('complete', startedAt, {
        mode: policy.public_mode,
        route,
        intent: intentExecution.result.intent,
        provider: summaryExecution.provider,
        model: summaryExecution.model,
      });

      return attachMetadata(
        {
          message,
          lecture_id: lectureId,
          course_id: courseId,
          route,
          intent: intentExecution.result,
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
  }

  if (route === 'quiz' && lectureId) {
    const quizStartedAt = performance.now();
    const quizExecution = await runAIQuizWithEngine(
      {
        lecture_id: lectureId,
        count: 4,
        difficulty: 'medium',
      },
      undefined,
      env,
      repository,
    );
    logSmartChatTiming('quiz', quizStartedAt, {
      provider: quizExecution?.provider ?? 'demo',
      model: quizExecution?.model ?? 'demo-quiz-v1',
      has_result: Boolean(quizExecution),
    });

    if (quizExecution) {
      logSmartChatTiming('complete', startedAt, {
        mode: policy.public_mode,
        route,
        intent: intentExecution.result.intent,
        provider: quizExecution.provider,
        model: quizExecution.model,
      });

      return attachMetadata(
        {
          message,
          lecture_id: lectureId,
          course_id: courseId,
          route,
          intent: intentExecution.result,
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
  }

  if (route === 'answer') {
    const answerStartedAt = performance.now();
    const answerExecution = await runAIAnswerWithExecution(
      {
        question: message,
        lecture_id: lectureId ?? undefined,
        limit: 4,
      },
      undefined,
      env,
      repository,
    );
    logSmartChatTiming('answer', answerStartedAt, {
      provider: answerExecution.provider,
      model: answerExecution.model,
    });
    logSmartChatTiming('complete', startedAt, {
      mode: policy.public_mode,
      route,
      intent: intentExecution.result.intent,
      provider: answerExecution.provider,
      model: answerExecution.model,
    });

    return attachMetadata(
      {
        message,
        lecture_id: lectureId,
        course_id: courseId,
        route,
        intent: intentExecution.result,
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

  logSmartChatTiming('complete', startedAt, {
    mode: policy.public_mode,
    route,
    intent: intentExecution.result.intent,
    provider: sharedResult.provider,
    model: sharedResult.model,
  });

  return sharedResult;
}
