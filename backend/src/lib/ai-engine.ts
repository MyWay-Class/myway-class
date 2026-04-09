import {
  answerAIQuestion,
  classifyAIIntent,
  createAISummary,
  generateAIQuiz,
  getLectureDetail,
  getLectureTranscript,
  listLectureNotes,
  type AIAction,
  type AIIntent,
  type AIProviderName,
  type AIIntentRequest,
  type AIIntentResult,
  type AIAnswerRequest,
  type AIAnswerResult,
  type AIQuizQuestion,
  type AIQuizRequest,
  type AIQuizResult,
  type AISummaryRequest,
  type AISummaryResult,
} from '@myway/shared';
import { getAIProviderSelection } from './ai-provider';
import { runOllamaChat, type OllamaChatMessage } from './providers';
import type { RuntimeBindings } from './runtime-env';

type JsonObject = Record<string, unknown>;

const OLLAMA_TIMEOUT_MS = 15_000;

function normalizeText(value: string): string {
  return value.replaceAll(/\s+/g, ' ').trim();
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trim()}...`;
}

function extractJsonCandidate(value: string): string | null {
  const fencedMatch = value.match(/```json\s*([\s\S]*?)```/i) ?? value.match(/```\s*([\s\S]*?)```/i);
  const candidate = (fencedMatch?.[1] ?? value).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}

function parseJsonObject(value: string): JsonObject | null {
  const candidate = extractJsonCandidate(value);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed as JsonObject;
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function pickDifficulty(value: unknown, fallback: AIQuizResult['difficulty']): AIQuizResult['difficulty'] {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }

  return fallback;
}

function pickIntent(value: unknown, fallback: AIIntent): AIIntent {
  const allowed: AIIntent[] = [
    'request_summary',
    'generate_quiz',
    'search_content',
    'ask_concept',
    'ask_recommendation',
    'explain_deeper',
    'translate',
    'compare',
    'create_shortform',
    'extract_audio',
    'analyze_progress',
    'general_chat',
    'clarify',
  ];

  return typeof value === 'string' && allowed.includes(value as AIIntent) ? (value as AIIntent) : fallback;
}

function pickAction(value: unknown, fallback: AIAction): AIAction {
  if (value === 'SEARCH' || value === 'DIRECT_ANSWER' || value === 'CLARIFY' || value === 'DECOMPOSE') {
    return value;
  }

  return fallback;
}

function pickConfidence(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0.35, Math.min(0.98, value));
  }

  return fallback;
}

function normalizeQuizQuestion(
  candidate: JsonObject | undefined,
  fallback: AIQuizQuestion,
): AIQuizQuestion {
  if (!candidate) {
    return fallback;
  }

  const question = pickString(candidate.question, fallback.question);
  const rawChoices = toStringArray(candidate.choices);
  const mergedChoices = [...rawChoices];

  for (const choice of fallback.choices) {
    if (mergedChoices.length >= 4) {
      break;
    }

    if (!mergedChoices.includes(choice)) {
      mergedChoices.push(choice);
    }
  }

  while (mergedChoices.length < 4) {
    const filler = fallback.choices[mergedChoices.length] ?? fallback.choices[0];
    mergedChoices.push(filler);
  }

  const correctChoiceIndex =
    typeof candidate.correct_choice_index === 'number' &&
    Number.isInteger(candidate.correct_choice_index) &&
    candidate.correct_choice_index >= 0 &&
    candidate.correct_choice_index < mergedChoices.length
      ? candidate.correct_choice_index
      : fallback.correct_choice_index;

  return {
    ...fallback,
    question,
    choices: mergedChoices.slice(0, 4),
    correct_choice_index: correctChoiceIndex,
    explanation: pickString(candidate.explanation, fallback.explanation),
  };
}

function buildSummaryPrompt(
  lectureTitle: string,
  courseTitle: string,
  sourceText: string,
  style: AISummaryRequest['style'],
  language: AISummaryRequest['language'],
): OllamaChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a careful lecture summarizer. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Lecture title: ${lectureTitle}`,
        `Course title: ${courseTitle}`,
        `Language: ${language ?? 'ko'}`,
        `Style: ${style ?? 'brief'}`,
        'Return JSON with the following shape:',
        '{"title":"string","content":"string","key_points":["string"]}',
        'Rules:',
        '- Use only the provided source text.',
        '- Keep factual claims grounded in the lecture.',
        '- title should be short and descriptive.',
        '- content should be concise and readable in the selected language.',
        '- key_points should contain 3 to 5 short bullets.',
        'Source text:',
        sourceText,
      ].join('\n'),
    },
  ];
}

function buildQuizPrompt(
  lectureTitle: string,
  courseTitle: string,
  sourceText: string,
  input: AIQuizRequest,
): OllamaChatMessage[] {
  const count = Math.max(1, Math.min(5, input.count ?? 4));
  const difficulty = input.difficulty ?? 'medium';

  return [
    {
      role: 'system',
      content:
        'You are a careful quiz writer. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Lecture title: ${lectureTitle}`,
        `Course title: ${courseTitle}`,
        `Difficulty: ${difficulty}`,
        `Question count: ${count}`,
        'Return JSON with the following shape:',
        '{"title":"string","difficulty":"easy|medium|hard","questions":[{"question":"string","choices":["string","string","string","string"],"correct_choice_index":0,"explanation":"string"}]}',
        'Rules:',
        '- Use only the provided source text.',
        '- Create exactly four choices per question.',
        '- Keep one clearly correct choice per question.',
        '- Explanations should be short and grounded in the lecture.',
        '- Output between 1 and 5 questions.',
        'Source text:',
        sourceText,
      ].join('\n'),
    },
  ];
}

function getLectureSourceText(lectureId: string): { lectureTitle: string; courseTitle: string; sourceText: string } | null {
  const lecture = getLectureDetail(lectureId);
  if (!lecture) {
    return null;
  }

  const transcript = getLectureTranscript(lecture.id);
  const note = listLectureNotes(lecture.id)[0];
  const sourceText = normalizeText(note?.content ?? transcript?.full_text ?? lecture.content_text);

  return {
    lectureTitle: lecture.title,
    courseTitle: lecture.course_title,
    sourceText,
  };
}

function getOllamaModel(env?: RuntimeBindings): string {
  return env?.MYWAY_OLLAMA_MODEL ?? env?.OLLAMA_MODEL ?? 'llama3.1';
}

function isRemoteFeatureEnabled(feature: 'intent' | 'answer' | 'summary' | 'quiz', preferredProvider?: AIProviderName): boolean {
  const provider = getAIProviderSelection(feature, preferredProvider);
  return provider.current_provider === 'ollama';
}

function buildIntentPrompt(input: AIIntentRequest, fallback: AIIntentResult): OllamaChatMessage[] {
  const lecture = input.lecture_id ? getLectureDetail(input.lecture_id) : undefined;

  return [
    {
      role: 'system',
      content:
        'You are an AI intent classifier for a learning platform. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Message: ${input.message}`,
        `Lecture title: ${lecture?.title ?? 'none'}`,
        `Course title: ${lecture?.course_title ?? 'none'}`,
        `Context: ${(input.context ?? []).join(' | ') || 'none'}`,
        'Return JSON with the following shape:',
        '{"intent":"request_summary|generate_quiz|search_content|ask_concept|ask_recommendation|explain_deeper|translate|compare|create_shortform|extract_audio|analyze_progress|general_chat|clarify","confidence":0.0,"action":"SEARCH|DIRECT_ANSWER|CLARIFY|DECOMPOSE","reason":"string","entities":["string"],"needs_clarification":true}',
        'Rules:',
        '- Keep the confidence between 0 and 1.',
        '- Keep the action aligned with the intent.',
        '- Use the lecture and context when it helps classification.',
        '- Return a concise reason in Korean.',
        '- entities should contain 2 to 6 short values.',
        `Fallback intent: ${fallback.intent}`,
        `Fallback action: ${fallback.action}`,
      ].join('\n'),
    },
  ];
}

function buildAnswerPrompt(input: AIAnswerRequest, fallback: AIAnswerResult): OllamaChatMessage[] {
  const lecture = input.lecture_id ? getLectureDetail(input.lecture_id) : undefined;
  const references = fallback.references.slice(0, 3);

  return [
    {
      role: 'system',
      content:
        'You are a grounded lecture assistant. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Question: ${input.question}`,
        `Lecture title: ${lecture?.title ?? 'none'}`,
        `Course title: ${lecture?.course_title ?? 'none'}`,
        `Intent: ${fallback.intent.intent}`,
        'Reference snippets:',
        ...references.map((reference, index) => `${index + 1}. ${reference.title}: ${reference.excerpt}`),
        'Return JSON with the following shape:',
        '{"answer":"string","suggestions":["string","string"]}',
        'Rules:',
        '- Base the answer on the provided references and lecture context.',
        '- Keep the answer short, direct, and natural in Korean.',
        '- suggestions should contain 2 short follow-up questions.',
        '- If the references are weak, acknowledge that briefly.',
      ].join('\n'),
    },
  ];
}

async function runOllamaStructuredIntent(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIIntentResult> {
  const fallback = classifyAIIntent(input);

  if (!isRemoteFeatureEnabled('intent', preferredProvider)) {
    return fallback;
  }

  const response = await runOllamaChat(buildIntentPrompt(input, fallback), env, {
    model: getOllamaModel(env),
    temperature: 0.1,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  const parsed = parseJsonObject(response ?? '');
  if (!parsed) {
    return fallback;
  }

  const intent = pickIntent(parsed.intent, fallback.intent);
  const confidence = pickConfidence(parsed.confidence, fallback.confidence);
  const action = pickAction(parsed.action, fallback.action);
  const entities = toStringArray(parsed.entities);
  const reason = pickString(parsed.reason, fallback.reason);
  const needsClarification =
    typeof parsed.needs_clarification === 'boolean'
      ? parsed.needs_clarification
      : fallback.needs_clarification;

  return {
    ...fallback,
    intent,
    confidence,
    action,
    entities: entities.length > 0 ? entities.slice(0, 6) : fallback.entities,
    reason,
    needs_clarification: needsClarification,
  };
}

async function runOllamaStructuredAnswer(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIAnswerResult> {
  const fallback = answerAIQuestion(input);

  if (!isRemoteFeatureEnabled('answer', preferredProvider)) {
    return fallback;
  }

  const response = await runOllamaChat(buildAnswerPrompt(input, fallback), env, {
    model: getOllamaModel(env),
    temperature: 0.2,
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  const parsed = parseJsonObject(response ?? '');
  if (!parsed) {
    return fallback;
  }

  const answer = pickString(parsed.answer, fallback.answer);
  if (!answer) {
    return fallback;
  }

  return {
    ...fallback,
    answer,
    suggestions: toStringArray(parsed.suggestions).slice(0, 2).concat(fallback.suggestions).slice(0, 2),
  };
}

export async function runAIIntentWithEngine(
  input: AIIntentRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIIntentResult> {
  return runOllamaStructuredIntent(input, preferredProvider, env);
}

export async function runAIAnswerWithEngine(
  input: AIAnswerRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIAnswerResult> {
  return runOllamaStructuredAnswer(input, preferredProvider, env);
}

export async function runAISummaryWithEngine(
  input: AISummaryRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AISummaryResult | null> {
  const fallback = createAISummary(input);
  if (!fallback) {
    return null;
  }

  const source = getLectureSourceText(input.lecture_id);

  if (!source || !isRemoteFeatureEnabled('summary', preferredProvider) || input.style === 'timeline') {
    return fallback;
  }

  const messages = buildSummaryPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input.style, input.language);
  const response = await runOllamaChat(messages, env, {
    model: getOllamaModel(env),
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  if (!response) {
    return fallback;
  }

  const parsed = parseJsonObject(response);
  if (!parsed) {
    return fallback;
  }

  const title = pickString(parsed.title, fallback.title ?? `${source.lectureTitle} · 요약`);
  const content = pickString(parsed.content, fallback.content ?? '');
  const keyPoints = toStringArray(parsed.key_points);

  if (!content) {
    return fallback;
  }

  return {
    lecture_id: input.lecture_id,
    title,
    style: input.style ?? 'brief',
    language: input.language ?? 'ko',
    content,
    key_points: keyPoints.length > 0 ? keyPoints.slice(0, 5) : fallback.key_points,
    references: fallback.references,
  };
}

export async function runAIQuizWithEngine(
  input: AIQuizRequest,
  preferredProvider?: AIProviderName,
  env?: RuntimeBindings,
): Promise<AIQuizResult | null> {
  const fallback = generateAIQuiz(input);
  if (!fallback) {
    return null;
  }

  const source = getLectureSourceText(input.lecture_id);

  if (!source || !isRemoteFeatureEnabled('quiz', preferredProvider)) {
    return fallback;
  }

  const messages = buildQuizPrompt(source.lectureTitle, source.courseTitle, truncate(source.sourceText, 6000), input);
  const response = await runOllamaChat(messages, env, {
    model: getOllamaModel(env),
    timeoutMs: OLLAMA_TIMEOUT_MS,
  });

  if (!response) {
    return fallback;
  }

  const parsed = parseJsonObject(response);
  if (!parsed) {
    return fallback;
  }

  const fallbackQuestions = fallback?.questions ?? [];
  const engineQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

  if (fallbackQuestions.length === 0 || engineQuestions.length === 0) {
    return fallback;
  }

  const questions = fallbackQuestions.map((fallbackQuestion, index) => {
    const engineQuestion = engineQuestions[index] as JsonObject | undefined;
    return normalizeQuizQuestion(engineQuestion, fallbackQuestion);
  });

  return {
    lecture_id: input.lecture_id,
    title: pickString(parsed.title, fallback.title),
    difficulty: pickDifficulty(parsed.difficulty, fallback.difficulty),
    questions,
  };
}
