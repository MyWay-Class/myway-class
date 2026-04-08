import { demoAudioExtractions } from '../../data/demo-data';
import type { AudioExtraction, AudioExtractionRequest } from '../../types';
import { createId, findLecture, now, upsertPipeline } from './helpers';
import { getLectureTranscript } from './transcript';

export function listAudioExtractions(lectureId: string): AudioExtraction[] {
  return demoAudioExtractions
    .filter((item) => item.lecture_id === lectureId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createAudioExtraction(
  userId: string,
  input: AudioExtractionRequest,
): { extraction: AudioExtraction; pipeline: ReturnType<typeof upsertPipeline> } | null {
  const lecture = findLecture(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const extraction: AudioExtraction = {
    id: createId('aud', demoAudioExtractions.length),
    lecture_id: lecture.id,
    user_id: userId,
    source_type: 'video',
    source_url: input.video_url ?? '/static/media/demo-lecture.mp4',
    audio_format: 'wav',
    audio_duration_ms: Math.max(lecture.duration_minutes * 60_000, 30_000),
    sample_rate: 16_000,
    channels: 1,
    status: 'COMPLETED',
    transcript_id: getLectureTranscript(lecture.id)?.id ?? null,
    stt_status: getLectureTranscript(lecture.id) ? 'COMPLETED' : 'PENDING',
    created_at: now(),
  };

  demoAudioExtractions.push(extraction);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    audio_status: 'COMPLETED',
    extraction_id: extraction.id,
  });

  return { extraction, pipeline };
}
