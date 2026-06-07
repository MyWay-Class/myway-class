import {
  buildSmartChatOverview,
  type MediaRepository,
  type SmartChatRequest,
  type SmartChatResult,
} from '@myway/shared';
import { runAIIntentWithExecution } from './ai-engine-runners';
import { getAIRuntimePolicy, type RuntimeBindings } from './runtime-env';
import { resolveAnswerRoute, resolveQuizRoute, resolveSummaryRoute } from './smart-chat-route-actions';
import { attachMetadata, DEMO_SMART_MODEL, logSmartChatTiming, normalizeRoute, type SmartChatMetadata } from './smart-chat-core-utils';

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
      } as SmartChatMetadata,
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
    const summaryResult = await resolveSummaryRoute(
      { message, lectureId, courseId, language: input.language, route, intent: intentExecution.result },
      env,
      repository,
    );
    logSmartChatTiming('summary', summaryStartedAt, {
      provider: summaryResult?.provider ?? 'demo',
      model: summaryResult?.model ?? 'demo-summary-v1',
      has_result: Boolean(summaryResult),
    });

    if (summaryResult) {
      logSmartChatTiming('complete', startedAt, {
        mode: policy.public_mode,
        route,
        intent: intentExecution.result.intent,
        provider: summaryResult.provider,
        model: summaryResult.model,
      });
      return summaryResult;
    }
  }

  if (route === 'quiz' && lectureId) {
    const quizStartedAt = performance.now();
    const quizResult = await resolveQuizRoute(
      { message, lectureId, courseId, route, intent: intentExecution.result },
      env,
      repository,
    );
    logSmartChatTiming('quiz', quizStartedAt, {
      provider: quizResult?.provider ?? 'demo',
      model: quizResult?.model ?? 'demo-quiz-v1',
      has_result: Boolean(quizResult),
    });

    if (quizResult) {
      logSmartChatTiming('complete', startedAt, {
        mode: policy.public_mode,
        route,
        intent: intentExecution.result.intent,
        provider: quizResult.provider,
        model: quizResult.model,
      });
      return quizResult;
    }
  }

  if (route === 'answer') {
    const answerStartedAt = performance.now();
    const answerResult = await resolveAnswerRoute(
      { message, lectureId, courseId, route, intent: intentExecution.result },
      env,
      repository,
    );
    logSmartChatTiming('answer', answerStartedAt, {
      provider: answerResult.provider,
      model: answerResult.model,
    });
    logSmartChatTiming('complete', startedAt, {
      mode: policy.public_mode,
      route,
      intent: intentExecution.result.intent,
      provider: answerResult.provider,
      model: answerResult.model,
    });
    return answerResult;
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
