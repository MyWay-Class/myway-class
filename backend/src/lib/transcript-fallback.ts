import { buildTranscriptChunks, type LectureDetail, type LectureTranscript } from '@myway/shared';
import { now } from '@myway/shared/lms/media/helpers';

function normalizeText(value: string | undefined | null): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSourceText(sourceText: string): string[] {
  const normalized = normalizeText(sourceText);
  if (!normalized) return [];

  const candidates = normalized
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (candidates.length > 0) {
    return candidates;
  }

  return [normalized];
}

function buildChunkWindows(totalDurationMs: number, count: number): Array<{ start_ms: number; end_ms: number }> {
  const safeDuration = Math.max(1000, Math.round(totalDurationMs || 0));
  const safeCount = Math.max(1, Math.min(count, 5));
  const windowSize = Math.max(1000, Math.floor(safeDuration / safeCount));

  return Array.from({ length: safeCount }, (_, index) => {
    const start_ms = index * windowSize;
    const end_ms = index >= safeCount - 1 ? safeDuration : Math.max(start_ms + 1000, (index + 1) * windowSize);
    return { start_ms, end_ms };
  });
}

export function buildFallbackLectureTranscript(lecture: LectureDetail | null | undefined): LectureTranscript | null {
  if (!lecture) return null;

  const sourceText = normalizeText(lecture.content_text || lecture.transcript_excerpt || lecture.title);
  if (!sourceText) return null;

  const sentences = splitSourceText(sourceText);
  const durationMs = Math.max(lecture.duration_minutes * 60_000, sentences.length * 30_000, 60_000);
  const windows = buildChunkWindows(durationMs, Math.max(1, Math.min(sentences.length, 4)));
  const chunks = buildTranscriptChunks(
    lecture.id,
    windows.map((window, index) => ({
      start_ms: window.start_ms,
      end_ms: window.end_ms,
      text: sentences[index] ?? sentences[sentences.length - 1] ?? sourceText,
      confidence: 0.78,
      speaker: lecture.course_id ? 'SPEAKER_01' : null,
      topic_tags: ['fallback', 'content-derived'],
      index,
    })),
  );

  return {
    id: `trs_fallback_${lecture.id}`,
    lecture_id: lecture.id,
    user_id: 'system',
    language: 'ko',
    full_text: sourceText,
    segments: chunks,
    word_count: sourceText.split(/\s+/).filter(Boolean).length,
    duration_ms: durationMs,
    stt_provider: 'content-derived',
    stt_model: 'fallback-v1',
    created_at: now(),
  };
}
