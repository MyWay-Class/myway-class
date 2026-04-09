import {
  createAISummary,
  generateAIQuiz,
  getLectureDetail,
  getLectureTranscript,
  listLectureNotes,
  type AIProviderName,
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

function isRemoteFeatureEnabled(feature: 'summary' | 'quiz', preferredProvider?: AIProviderName): boolean {
  const provider = getAIProviderSelection(feature, preferredProvider);
  return provider.current_provider === 'ollama';
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
  const response = await runOllamaChat(messages, env);

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
  const response = await runOllamaChat(messages, env);

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
