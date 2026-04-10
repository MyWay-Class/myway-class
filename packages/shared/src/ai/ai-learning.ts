import { getLectureDetail } from '../lms/learning';
import { collectLectureReferences } from './intent/corpus';
import { getLectureTranscript, listLectureNotes } from '../lms/media';
import type {
  AIQuizQuestion,
  AIQuizRequest,
  AIQuizResult,
  AISummaryRequest,
  AISummaryResult,
  MediaSummaryStyle,
} from '../types';
import { memoryMediaRepository, type MediaRepository } from '../lms/media/store';

function normalizeText(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function splitSentences(text: string): string[] {
  return normalizeText(text)
    .split(/[.!?]\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function formatTimeLabel(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function extractKeyPoints(text: string, limit: number): string[] {
  return unique(
    splitSentences(text)
      .map((sentence) => sentence.replaceAll(/^[\d.-]+\s*/g, '').trim())
      .filter(Boolean),
  ).slice(0, limit);
}

function buildSummaryContent(text: string, style: MediaSummaryStyle): string {
  const sentences = splitSentences(text);

  if (style === 'detailed') {
    return sentences.slice(0, 4).map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');
  }

  if (style === 'timeline') {
    return sentences.slice(0, 4).map((sentence, index) => `[${formatTimeLabel(index * 60_000)}] ${sentence}`).join('\n');
  }

  return sentences.slice(0, 2).join(' ');
}

async function buildSummaryReferences(lectureId: string, repository: MediaRepository = memoryMediaRepository) {
  return (await collectLectureReferences(lectureId, repository)).slice(0, 2);
}

function buildQuizChoices(concepts: string[], lectureTitle: string): string[] {
  const fallback = unique([
    ...concepts,
    lectureTitle,
    '강의 핵심',
    '학습 포인트',
    '복습 내용',
    '적용 사례',
  ]);

  return fallback.slice(0, 4);
}

function rotateChoices(choices: string[], rotation: number): string[] {
  if (choices.length === 0) {
    return choices;
  }

  const offset = rotation % choices.length;
  return [...choices.slice(offset), ...choices.slice(0, offset)];
}

function collectQuizConcepts(sourceText: string, lectureTitle: string, courseTitle: string): string[] {
  return unique([
    ...extractKeyPoints(sourceText, 6),
    ...sourceText.split(/\s+/).slice(0, 8),
    lectureTitle,
    courseTitle,
  ]);
}

function buildFallbackQuizReference(lectureId: string, lectureTitle: string, courseTitle: string, sourceText: string) {
  return {
    id: `lecture_${lectureId}_01`,
    lecture_id: lectureId,
    source_type: 'lecture' as const,
    source_id: lectureId,
    title: `${courseTitle} · ${lectureTitle} · 강의 본문`,
    content: sourceText.slice(0, 240),
    excerpt: sourceText.slice(0, 240),
    similarity: 0.85,
    chunk_index: 0,
  };
}

function buildQuizQuestion(
  lectureId: string,
  lectureTitle: string,
  courseTitle: string,
  sourceText: string,
  concepts: string[],
  quizReferences: Awaited<ReturnType<typeof buildSummaryReferences>>,
  index: number,
): AIQuizQuestion {
  const concept = concepts[index % Math.max(1, concepts.length)] ?? lectureTitle;
  const choicePool = buildQuizChoices(concepts.filter((item) => item !== concept), lectureTitle);
  const candidates = [concept, ...choicePool.filter((choice) => choice !== concept)].slice(0, 4);
  const rotatedChoices = candidates.length >= 4 ? rotateChoices(candidates, index) : buildQuizChoices([concept, ...choicePool], lectureTitle);
  const correctIndex = rotatedChoices.indexOf(concept);
  const reference = quizReferences[index % Math.max(1, quizReferences.length)] ?? quizReferences[0];

  return {
    id: `quiz_${lectureId}_${String(index + 1).padStart(2, '0')}`,
    question: `"${concept}"와 가장 관련이 깊은 설명은 무엇인가요?`,
    choices: rotatedChoices,
    correct_choice_index: correctIndex >= 0 ? correctIndex : 0,
    explanation: reference?.excerpt ?? sourceText,
    reference: reference ?? buildFallbackQuizReference(lectureId, lectureTitle, courseTitle, sourceText),
  };
}

export async function createAISummary(
  input: AISummaryRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AISummaryResult | null> {
  const lecture = getLectureDetail(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const transcript = await getLectureTranscript(lecture.id, repository);
  const note = (await listLectureNotes(lecture.id, repository))[0];
  const sourceText = note?.content ?? transcript?.full_text ?? lecture.content_text;
  const style = input.style ?? 'brief';
  const titleSuffix =
    style === 'detailed'
      ? '상세 요약'
      : style === 'timeline'
        ? '타임라인 요약'
        : '핵심 요약';
  const keyPoints = unique([
    ...extractKeyPoints(sourceText, style === 'detailed' ? 5 : 3),
    ...(note?.key_concepts ?? []),
  ]).slice(0, style === 'detailed' ? 5 : 3);

  return {
    lecture_id: lecture.id,
    title: `${lecture.title} · ${titleSuffix}`,
    style,
    language: input.language ?? 'ko',
    content: buildSummaryContent(sourceText, style),
    key_points: keyPoints,
    references: await buildSummaryReferences(lecture.id, repository),
  };
}

export async function generateAIQuiz(
  input: AIQuizRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AIQuizResult | null> {
  const lecture = getLectureDetail(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const transcript = await getLectureTranscript(lecture.id, repository);
  const note = (await listLectureNotes(lecture.id, repository))[0];
  const sourceText = note?.content ?? transcript?.full_text ?? lecture.content_text;
  const concepts = collectQuizConcepts(sourceText, lecture.title, lecture.course_title);
  let count = input.count ?? 4;
  if (input.difficulty === 'hard') {
    count = input.count ?? 5;
  } else if (input.difficulty === 'easy') {
    count = input.count ?? 3;
  }
  count = Math.max(1, Math.min(5, count));
  const quizReferences = await buildSummaryReferences(lecture.id, repository);
  const questions: AIQuizQuestion[] = Array.from({ length: count }, (_, index) =>
    buildQuizQuestion(
      lecture.id,
      lecture.title,
      lecture.course_title,
      sourceText,
      concepts,
      quizReferences,
      index,
    ),
  );

  let difficulty = input.difficulty ?? 'medium';
  if (!input.difficulty && typeof input.count === 'number' && input.count <= 3) {
    difficulty = 'easy';
  }

  return {
    lecture_id: lecture.id,
    title: `${lecture.title} · AI 퀴즈`,
    difficulty,
    questions,
  };
}
