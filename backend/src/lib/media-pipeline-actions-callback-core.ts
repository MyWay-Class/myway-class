import type { AudioExtraction, AudioExtractionCallbackRequest, LecturePipeline, MediaRepository } from '@myway/shared';
import { getAudioExtraction } from './media-repository-read-ops';
import { updateAudioExtraction } from './media-repository-write-ops';
import { runTranscriptGeneration, type STTAdapterResult } from './stt-adapter';
import { persistLectureDuration } from './learning-store';
import type { RuntimeBindings } from './runtime-env';
import { createLectureSummaryNote } from './media-repository-write-ops';
import { listLectureNotes } from './media-repository-read-ops';

export type MediaExtractionCallbackResult =
  | {
      ok: true;
      extraction: AudioExtraction;
      pipeline: LecturePipeline;
      transcript_result: STTAdapterResult | null;
    }
  | {
      ok: false;
      reason: 'extraction_not_found' | 'callback_invalid' | 'transcript_failed';
      message: string;
    };

async function ensureAutoTimelineSummary(
  userId: string,
  lectureId: string,
  repository?: MediaRepository,
): Promise<void> {
  const notes = await listLectureNotes(lectureId, repository);
  if (notes.some((note) => note.note_type === 'ai_timeline')) {
    return;
  }

  await createLectureSummaryNote(
    userId,
    {
      lecture_id: lectureId,
      style: 'timeline',
      language: 'ko',
    },
    repository,
  );
}

export async function completeMediaExtractionJob(
  userId: string,
  payload: AudioExtractionCallbackRequest,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<MediaExtractionCallbackResult> {
  const extraction = await getAudioExtraction(payload.extraction_id, repository);
  if (!extraction || extraction.lecture_id !== payload.lecture_id) {
    return {
      ok: false,
      reason: 'extraction_not_found',
      message: '오디오 추출 job을 찾을 수 없습니다.',
    };
  }

  if (payload.status === 'FAILED') {
    const failed = await updateAudioExtraction(payload, repository);
    if (!failed) {
      return {
        ok: false,
        reason: 'callback_invalid',
        message: '오디오 추출 상태를 갱신할 수 없습니다.',
      };
    }

    return {
      ok: true,
      extraction: failed.extraction,
      pipeline: failed.pipeline,
      transcript_result: null,
    };
  }

  if (!payload.audio_url?.trim()) {
    return {
      ok: false,
      reason: 'callback_invalid',
      message: '완료 callback에는 audio_url이 필요합니다.',
    };
  }

  const transcriptResult = await runTranscriptGeneration(
    userId,
    {
      lecture_id: extraction.lecture_id,
      audio_url: payload.audio_url.trim(),
      duration_ms: payload.audio_duration_ms ?? extraction.audio_duration_ms,
      language: extraction.language ?? 'ko',
      stt_provider: extraction.requested_stt_provider,
      stt_model: extraction.requested_stt_model,
    },
    'cloudflare',
    env,
    repository,
  );

  if (!transcriptResult.ok) {
    const failed = await updateAudioExtraction({
      ...payload,
      status: 'FAILED',
      error_message: '오디오 전사를 생성할 수 없습니다.',
    }, repository);

    return {
      ok: false,
      reason: 'transcript_failed',
      message: failed?.extraction.processing_error ?? '오디오 전사를 생성할 수 없습니다.',
    };
  }

  await persistLectureDuration(extraction.lecture_id, Math.max(1, Math.round(transcriptResult.duration_ms / 60_000)), env);
  await ensureAutoTimelineSummary(userId, extraction.lecture_id, repository);

  const completed = await updateAudioExtraction({
    ...payload,
    status: 'COMPLETED',
    transcript_id: transcriptResult.transcript_id,
    stt_status: 'COMPLETED',
  }, repository);

  if (!completed) {
    return {
      ok: false,
      reason: 'callback_invalid',
      message: '오디오 추출 상태를 갱신할 수 없습니다.',
    };
  }

  return {
    ok: true,
    extraction: completed.extraction,
    pipeline: completed.pipeline,
    transcript_result: transcriptResult,
  };
}
