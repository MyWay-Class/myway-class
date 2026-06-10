import type { AudioExtraction, AudioExtractionCallbackRequest, LecturePipeline, MediaRepository } from '@myway/shared';
import { runTranscriptGeneration, type STTAdapterResult } from './stt-adapter';
import { persistLectureDuration } from './learning-store';
import type { RuntimeBindings } from './runtime-env';

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
  const notes = repository ? await repository.listLectureNotes(lectureId) : [];
  if (notes.some((note) => note.note_type === 'ai_timeline')) {
    return;
  }

  if (!repository) {
    return;
  }

  await repository.createLectureSummaryNote(userId, {
    lecture_id: lectureId,
    style: 'timeline',
    language: 'ko',
  });
}

export async function completeMediaExtractionJob(
  userId: string,
  payload: AudioExtractionCallbackRequest,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<MediaExtractionCallbackResult> {
  const extraction = repository ? await repository.getAudioExtraction(payload.extraction_id) : undefined;
  if (!extraction || extraction.lecture_id !== payload.lecture_id) {
    return {
      ok: false,
      reason: 'extraction_not_found',
      message: '오디오 추출 job을 찾을 수 없습니다.',
    };
  }

  if (payload.status === 'FAILED') {
    const failed = repository ? await repository.updateAudioExtraction(payload) : null;
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
    const failed = repository
      ? await repository.updateAudioExtraction({
      ...payload,
      status: 'FAILED',
      error_message: '오디오 전사를 생성할 수 없습니다.',
    })
      : null;

    return {
      ok: false,
      reason: 'transcript_failed',
      message: failed?.extraction.processing_error ?? '오디오 전사를 생성할 수 없습니다.',
    };
  }

  await persistLectureDuration(extraction.lecture_id, Math.max(1, Math.round(transcriptResult.duration_ms / 60_000)), env);
  await ensureAutoTimelineSummary(userId, extraction.lecture_id, repository);

  const completed = repository
    ? await repository.updateAudioExtraction({
    ...payload,
    status: 'COMPLETED',
    transcript_id: transcriptResult.transcript_id,
    stt_status: 'COMPLETED',
  })
    : null;

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
