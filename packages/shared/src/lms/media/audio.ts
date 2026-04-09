import { demoAudioExtractions } from '../../data/demo-data';
import type { AudioExtraction, AudioExtractionRequest } from '../../types';
import { createId, findLecture, now, upsertPipeline } from './helpers';
import { getLectureTranscript } from './transcript';

function inferAudioFormat(source: string | undefined): string {
  if (!source) {
    return 'pending';
  }

  const normalized = source.split('?')[0]?.split('#')[0] ?? '';
  const extension = normalized.includes('.') ? normalized.split('.').pop()?.toLowerCase() : '';

  if (!extension) {
    return 'wav';
  }

  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(extension)) {
    return extension;
  }

  return 'wav';
}

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
    source_video_key: input.video_asset_key,
    source_video_name: input.source_file_name,
    source_content_type: input.source_content_type,
    source_size_bytes: input.source_size_bytes,
    audio_url: input.audio_url ?? null,
    audio_format: input.audio_url ? inferAudioFormat(input.audio_url) : 'pending',
    audio_duration_ms: Math.max(lecture.duration_minutes * 60_000, 30_000),
    sample_rate: 16_000,
    channels: 1,
    status: input.audio_url ? 'COMPLETED' : 'PROCESSING',
    transcript_id: getLectureTranscript(lecture.id)?.id ?? null,
    stt_status: getLectureTranscript(lecture.id) ? 'COMPLETED' : input.audio_url ? 'PROCESSING' : 'PENDING',
    created_at: now(),
  };

  demoAudioExtractions.push(extraction);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    audio_status: extraction.status,
    extraction_id: extraction.id,
  });

  return { extraction, pipeline };
}
