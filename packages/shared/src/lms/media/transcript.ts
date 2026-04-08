import { demoLectureTranscripts } from '../../data/demo-data';
import type { LectureTranscript, TranscriptCreateRequest } from '../../types';
import { createId, findLecture, now, splitIntoSegments, upsertPipeline, normalizeText } from './helpers';

export function getLectureTranscript(lectureId: string): LectureTranscript | undefined {
  return demoLectureTranscripts.find((item) => item.lecture_id === lectureId);
}

export function listLectureTranscripts(lectureId: string): LectureTranscript[] {
  return demoLectureTranscripts
    .filter((item) => item.lecture_id === lectureId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createLectureTranscript(
  userId: string,
  input: TranscriptCreateRequest,
): { transcript: LectureTranscript; pipeline: ReturnType<typeof upsertPipeline> } | null {
  const lecture = findLecture(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const fullText = normalizeText(input.text || lecture.content_text || '');
  if (!fullText) {
    return null;
  }

  const durationMs = input.duration_ms ?? Math.max(lecture.duration_minutes * 60_000, fullText.length * 40, 180_000);
  const transcript: LectureTranscript = {
    id: createId('trs', demoLectureTranscripts.length),
    lecture_id: lecture.id,
    user_id: userId,
    language: input.language ?? 'ko',
    full_text: fullText,
    segments: splitIntoSegments(fullText, durationMs),
    word_count: fullText.split(/\s+/).filter(Boolean).length,
    duration_ms: durationMs,
    stt_provider: input.stt_provider ?? (input.text ? 'text-derived-stt' : 'demo-stt'),
    stt_model: input.stt_model ?? 'pseudo-stt-v1',
    created_at: now(),
  };

  demoLectureTranscripts.push(transcript);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    transcript_status: 'COMPLETED',
    transcript_id: transcript.id,
  });

  return { transcript, pipeline };
}
