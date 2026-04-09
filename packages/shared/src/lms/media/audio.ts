import { demoAudioExtractions } from '../../data/demo-data';
import type { AudioExtraction, AudioExtractionCallbackRequest, AudioExtractionRequest } from '../../types';
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

export function getAudioExtraction(extractionId: string): AudioExtraction | undefined {
  return demoAudioExtractions.find((item) => item.id === extractionId);
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
    language: input.language ?? 'ko',
    requested_stt_provider: input.stt_provider,
    requested_stt_model: input.stt_model,
    processing_job_id: null,
    processing_error: null,
    audio_url: input.audio_url ?? null,
    audio_format: input.audio_url ? inferAudioFormat(input.audio_url) : 'pending',
    audio_duration_ms: Math.max(lecture.duration_minutes * 60_000, 30_000),
    sample_rate: 16_000,
    channels: 1,
    status: input.audio_url ? 'COMPLETED' : 'PROCESSING',
    transcript_id: getLectureTranscript(lecture.id)?.id ?? null,
    stt_status: getLectureTranscript(lecture.id) ? 'COMPLETED' : input.audio_url ? 'PROCESSING' : 'PENDING',
    created_at: now(),
    processed_at: input.audio_url ? now() : null,
    updated_at: now(),
  };

  demoAudioExtractions.push(extraction);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    audio_status: extraction.status,
    extraction_id: extraction.id,
  });

  return { extraction, pipeline };
}

export function updateAudioExtraction(
  input: AudioExtractionCallbackRequest & {
    transcript_id?: string | null;
    stt_status?: AudioExtraction['stt_status'];
  },
): { extraction: AudioExtraction; pipeline: ReturnType<typeof upsertPipeline> } | null {
  const targetIndex = demoAudioExtractions.findIndex((item) => item.id === input.extraction_id && item.lecture_id === input.lecture_id);
  if (targetIndex < 0) {
    return null;
  }

  const current = demoAudioExtractions[targetIndex];
  const nextStatus = input.status;
  const next: AudioExtraction = {
    ...current,
    processing_job_id: input.processing_job_id ?? current.processing_job_id ?? null,
    processing_error: input.error_message ?? (nextStatus === 'FAILED' ? '오디오 추출에 실패했습니다.' : null),
    audio_url: input.audio_url ?? current.audio_url ?? null,
    audio_format: input.audio_format ?? (input.audio_url ? inferAudioFormat(input.audio_url) : current.audio_format),
    audio_duration_ms: input.audio_duration_ms ?? current.audio_duration_ms,
    sample_rate: input.sample_rate ?? current.sample_rate,
    channels: input.channels ?? current.channels,
    status: nextStatus,
    transcript_id: input.transcript_id ?? current.transcript_id,
    stt_status:
      input.stt_status ??
      (nextStatus === 'FAILED'
        ? 'FAILED'
        : input.transcript_id
          ? 'COMPLETED'
          : current.stt_status),
    processed_at: nextStatus === 'COMPLETED' ? now() : current.processed_at ?? null,
    updated_at: now(),
  };

  demoAudioExtractions[targetIndex] = next;
  const pipeline = upsertPipeline({
    lecture_id: next.lecture_id,
    audio_status: next.status,
    extraction_id: next.id,
    transcript_status: next.transcript_id ? 'COMPLETED' : next.stt_status,
    transcript_id: next.transcript_id,
  });

  return { extraction: next, pipeline };
}
