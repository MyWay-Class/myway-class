import {
  createAudioExtraction,
  getAudioExtraction,
  updateAudioExtraction,
  type AudioExtraction,
  type AudioExtractionCallbackRequest,
  type AudioExtractionRequest,
  type LecturePipeline,
} from '@myway/shared';
import { dispatchMediaProcessorJob } from './media-processor';
import { runTranscriptGeneration, type STTAdapterResult } from './stt-adapter';
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

function buildCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/v1/media/extract-audio/callback`;
}

export async function createMediaExtractionJob(
  userId: string,
  input: AudioExtractionRequest,
  requestUrl: string,
  env?: RuntimeBindings,
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
    );

    if (!transcriptResult.ok) {
      return {
        ok: false,
        reason: 'transcript_failed',
        message: '오디오 전사를 생성할 수 없습니다.',
      };
    }
  }

  const extractionResult = createAudioExtraction(userId, {
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
  });

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
    updateAudioExtraction({
      extraction_id: extractionResult.extraction.id,
      lecture_id: extractionResult.extraction.lecture_id,
      status: 'FAILED',
      error_message: dispatchResult.message,
    });

    return {
      ok: false,
      reason: dispatchResult.reason === 'not_configured' ? 'processor_not_configured' : 'dispatch_failed',
      message: dispatchResult.message,
    };
  }

  const updated = updateAudioExtraction({
    extraction_id: extractionResult.extraction.id,
    lecture_id: extractionResult.extraction.lecture_id,
    status: dispatchResult.status,
    processing_job_id: dispatchResult.job_id ?? undefined,
  });

  return {
    ok: true,
    mode: 'processing',
    extraction: updated?.extraction ?? extractionResult.extraction,
    pipeline: updated?.pipeline ?? extractionResult.pipeline,
    transcript_result: null,
  };
}

export async function completeMediaExtractionJob(
  userId: string,
  payload: AudioExtractionCallbackRequest,
  env?: RuntimeBindings,
): Promise<MediaExtractionCallbackResult> {
  const extraction = getAudioExtraction(payload.extraction_id);
  if (!extraction || extraction.lecture_id !== payload.lecture_id) {
    return {
      ok: false,
      reason: 'extraction_not_found',
      message: '오디오 추출 job을 찾을 수 없습니다.',
    };
  }

  if (payload.status === 'FAILED') {
    const failed = updateAudioExtraction(payload);
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
      language: extraction.language ?? 'ko',
      stt_provider: extraction.requested_stt_provider,
      stt_model: extraction.requested_stt_model,
    },
    'cloudflare',
    env,
  );

  if (!transcriptResult.ok) {
    const failed = updateAudioExtraction({
      ...payload,
      status: 'FAILED',
      error_message: '오디오 전사를 생성할 수 없습니다.',
    });

    return {
      ok: false,
      reason: 'transcript_failed',
      message: failed?.extraction.processing_error ?? '오디오 전사를 생성할 수 없습니다.',
    };
  }

  const completed = updateAudioExtraction({
    ...payload,
    status: 'COMPLETED',
    transcript_id: transcriptResult.transcript_id,
    stt_status: 'COMPLETED',
  });

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
