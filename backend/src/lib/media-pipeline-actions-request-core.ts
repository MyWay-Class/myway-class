import type { AudioExtraction, LecturePipeline, MediaRepository, AudioExtractionRequest } from '@myway/shared';
import { dispatchMediaProcessorJob } from './media-processor';
import { runTranscriptGeneration, type STTAdapterResult } from './stt-adapter';
import { persistLectureDuration } from './learning-store';
import type { RuntimeBindings } from './runtime-env';

export type MediaExtractionRequestResult =
  | {
      ok: true;
      mode: 'ready' | 'processing';
      extraction: AudioExtraction;
      pipeline: LecturePipeline;
      transcript_result: STTAdapterResult | null;
    }
  | {
      ok: false;
      reason: 'extraction_failed' | 'processor_not_configured' | 'dispatch_failed' | 'transcript_failed';
      message: string;
    };

function buildCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/v1/media/extract-audio/callback`;
}

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

export async function createMediaExtractionJob(
  userId: string,
  input: AudioExtractionRequest,
  requestUrl: string,
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<MediaExtractionRequestResult> {
  let transcriptResult: STTAdapterResult | null = null;

  if (input.audio_url?.trim()) {
    transcriptResult = await runTranscriptGeneration(
      userId,
      {
        lecture_id: input.lecture_id,
        audio_url: input.audio_url.trim(),
        language: input.language ?? 'ko',
        stt_provider: input.stt_provider?.trim(),
        stt_model: input.stt_model?.trim(),
      },
      'cloudflare',
      env,
      repository,
    );

    if (!transcriptResult.ok) {
      return {
        ok: false,
        reason: 'transcript_failed',
        message: '오디오 전사를 생성할 수 없습니다.',
      };
    }

    await persistLectureDuration(input.lecture_id, Math.max(1, Math.round(transcriptResult.duration_ms / 60_000)), env);
    await ensureAutoTimelineSummary(userId, input.lecture_id, repository);
  }

  const extractionResult = repository
    ? await repository.createAudioExtraction(userId, {
    lecture_id: input.lecture_id,
    video_url: input.video_url?.trim(),
    video_asset_key: input.video_asset_key?.trim(),
    source_file_name: input.source_file_name?.trim(),
    source_content_type: input.source_content_type?.trim(),
    source_size_bytes: input.source_size_bytes,
    audio_url: input.audio_url?.trim(),
    language: input.language ?? 'ko',
    stt_provider: input.stt_provider?.trim(),
    stt_model: input.stt_model?.trim(),
  })
    : null;

  if (!extractionResult) {
    return {
      ok: false,
      reason: 'extraction_failed',
      message: '오디오 추출을 생성할 수 없습니다.',
    };
  }

  if (input.audio_url?.trim()) {
    return {
      ok: true,
      mode: 'ready',
      extraction: extractionResult.extraction,
      pipeline: extractionResult.pipeline,
      transcript_result: transcriptResult,
    };
  }

  const dispatchResult = await dispatchMediaProcessorJob(
    {
      extraction: extractionResult.extraction,
      callback_url: buildCallbackUrl(requestUrl),
    },
    env,
  );

  if (!dispatchResult.ok) {
    if (repository) {
      await repository.updateAudioExtraction({
        extraction_id: extractionResult.extraction.id,
        lecture_id: extractionResult.extraction.lecture_id,
        status: 'FAILED',
        error_message: dispatchResult.message,
      });
    }
    return {
      ok: false,
      reason: dispatchResult.reason === 'not_configured' ? 'processor_not_configured' : 'dispatch_failed',
      message: dispatchResult.message,
    };
  }

  const updated = repository
    ? await repository.updateAudioExtraction({
        extraction_id: extractionResult.extraction.id,
        lecture_id: extractionResult.extraction.lecture_id,
        status: dispatchResult.status,
        processing_job_id: dispatchResult.job_id ?? undefined,
      })
    : null;

  return {
    ok: true,
    mode: 'processing',
    extraction: updated?.extraction ?? extractionResult.extraction,
    pipeline: updated?.pipeline ?? extractionResult.pipeline,
    transcript_result: null,
  };
}
