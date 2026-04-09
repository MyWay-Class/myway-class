import type { AudioExtraction, AudioExtractionCallbackRequest } from '@myway/shared';
import { getMediaProcessorRuntimeSettings, type RuntimeBindings } from './runtime-env';

type MediaProcessorDispatchInput = {
  extraction: AudioExtraction;
  callback_url: string;
};

type MediaProcessorDispatchResult =
  | {
      ok: true;
      job_id: string | null;
      status: 'PENDING' | 'PROCESSING';
    }
  | {
      ok: false;
      reason: 'not_configured' | 'dispatch_failed';
      message: string;
    };

type MediaProcessorResponse = {
  job_id?: string;
  status?: 'PENDING' | 'PROCESSING';
};

export function verifyMediaCallbackSecret(request: Request, env?: RuntimeBindings): boolean {
  const { callback_secret } = getMediaProcessorRuntimeSettings(env);
  if (!callback_secret) {
    return false;
  }

  return request.headers.get('x-myway-media-callback-secret') === callback_secret;
}

export async function dispatchMediaProcessorJob(
  input: MediaProcessorDispatchInput,
  env?: RuntimeBindings,
): Promise<MediaProcessorDispatchResult> {
  const settings = getMediaProcessorRuntimeSettings(env);
  if (!settings.url) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'MYWAY_MEDIA_PROCESSOR_URL이 설정되지 않았습니다.',
    };
  }

  const response = await fetch(settings.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.token ? { Authorization: `Bearer ${settings.token}` } : {}),
    },
    body: JSON.stringify({
      extraction_id: input.extraction.id,
      lecture_id: input.extraction.lecture_id,
      source_video_url: input.extraction.source_url,
      source_video_key: input.extraction.source_video_key,
      source_file_name: input.extraction.source_video_name,
      source_content_type: input.extraction.source_content_type,
      source_size_bytes: input.extraction.source_size_bytes,
      callback: {
        url: input.callback_url,
        secret: settings.callback_secret ?? null,
      },
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: 'dispatch_failed',
      message: `미디어 처리 서비스 요청에 실패했습니다. (${response.status})`,
    };
  }

  const payload = (await response.json().catch(() => null)) as MediaProcessorResponse | null;
  return {
    ok: true,
    job_id: payload?.job_id ?? null,
    status: payload?.status ?? 'PROCESSING',
  };
}

export function normalizeMediaCallbackPayload(body: AudioExtractionCallbackRequest | null): AudioExtractionCallbackRequest | null {
  if (!body?.extraction_id?.trim() || !body?.lecture_id?.trim() || !body?.status?.trim()) {
    return null;
  }

  return {
    extraction_id: body.extraction_id.trim(),
    lecture_id: body.lecture_id.trim(),
    status: body.status,
    audio_url: body.audio_url?.trim(),
    audio_format: body.audio_format?.trim(),
    audio_duration_ms: body.audio_duration_ms,
    sample_rate: body.sample_rate,
    channels: body.channels,
    processing_job_id: body.processing_job_id?.trim(),
    error_message: body.error_message?.trim(),
  };
}
