import {
  createLectureSummaryNote,
  type AudioExtractionCallbackRequest,
  type AudioExtractionRequest,
  type MediaSummaryRequest,
  type TranscriptCreateRequest,
  type AuthUser,
} from '@myway/shared';
import { uploadLectureVideoAsset } from '../lib/media-assets';
import { persistLectureDuration, persistLectureVideoAsset } from '../lib/learning-store';
import { completeMediaExtractionJob, createMediaExtractionJob } from '../lib/media-pipeline';
import { normalizeMediaCallbackPayload } from '../lib/media-processor';
import { buildExtractionCallbackResponse, buildExtractionResponse } from '../lib/media-response';
import { PUBLIC_STT_MAX_DURATION_MS, runTranscriptGeneration } from '../lib/stt-adapter';
import type { RuntimeBindings } from '../lib/runtime-env';
import type { getMediaRepository } from './media-route-guards';

export async function uploadLectureVideoAction(
  lectureId: string,
  videoFile: Parameters<typeof uploadLectureVideoAsset>[1],
  requestUrl: string,
  env?: RuntimeBindings,
) {
  const upload = await uploadLectureVideoAsset(lectureId, videoFile, requestUrl, env);
  if (!upload) return null;
  try {
    await persistLectureVideoAsset(lectureId, upload.video_url, upload.asset_key, env);
  } catch (error) {
    console.error('failed to persist lecture video asset', error);
  }
  return upload;
}

export async function transcribeLectureAction(
  user: AuthUser,
  body: TranscriptCreateRequest | null,
  env: RuntimeBindings | undefined,
  repository: ReturnType<typeof getMediaRepository>,
) {
  const lectureId = body?.lecture_id?.trim();
  if (!lectureId) return { error: 'LECTURE_ID_REQUIRED' as const };

  if (typeof body?.duration_ms === 'number' && body.duration_ms > PUBLIC_STT_MAX_DURATION_MS) {
    return { error: 'STT_INPUT_TOO_LONG' as const, lectureId };
  }

  const language = body?.language === 'en' ? 'en' : 'ko';
  const result = await runTranscriptGeneration(
    user.id,
    {
      lecture_id: lectureId,
      text: body?.text?.trim(),
      audio_url: body?.audio_url?.trim(),
      duration_ms: body?.duration_ms,
      language,
      stt_provider: body?.stt_provider?.trim(),
      stt_model: body?.stt_model?.trim(),
    },
    undefined,
    env,
    repository,
  );
  if (!result.ok) return { error: result.reason === 'input_too_large' ? ('STT_INPUT_TOO_LONG' as const) : ('TRANSCRIPT_FAILED' as const), lectureId };

  await persistLectureDuration(lectureId, Math.max(1, Math.round(result.duration_ms / 60_000)), env);
  await createLectureSummaryNote(user.id, { lecture_id: lectureId, style: 'timeline', language }, repository);
  return { lectureId, result };
}

export async function summarizeLectureAction(
  user: AuthUser,
  body: MediaSummaryRequest | null,
  repository: ReturnType<typeof getMediaRepository>,
) {
  const lectureId = body?.lecture_id?.trim();
  if (!lectureId) return { error: 'LECTURE_ID_REQUIRED' as const };
  const result = await createLectureSummaryNote(
    user.id,
    { lecture_id: lectureId, style: body?.style ?? 'brief', language: body?.language ?? 'ko' },
    repository,
  );
  if (!result) return { error: 'SUMMARY_FAILED' as const, lectureId };
  return { lectureId, result };
}

export async function extractAudioAction(
  user: AuthUser,
  body: AudioExtractionRequest | null,
  requestUrl: string,
  env: RuntimeBindings | undefined,
  repository: ReturnType<typeof getMediaRepository>,
) {
  const lectureId = body?.lecture_id?.trim();
  if (!body) return { error: 'INVALID_BODY' as const };
  if (!lectureId) return { error: 'LECTURE_ID_REQUIRED' as const };

  const result = await createMediaExtractionJob(user.id, body, requestUrl, env, repository);
  if (!result.ok) return { error: result.reason, message: result.message };

  return {
    payload: buildExtractionResponse(result.extraction, result.pipeline),
    message: result.mode === 'ready' ? '오디오 추출과 전사가 완료되었습니다.' : '오디오 추출 job이 생성되었습니다.',
  };
}

export async function extractionCallbackAction(
  body: AudioExtractionCallbackRequest | null,
  env: RuntimeBindings | undefined,
  repository: ReturnType<typeof getMediaRepository>,
) {
  const payload = normalizeMediaCallbackPayload(body);
  if (!payload) return { error: 'CALLBACK_INVALID' as const };

  const result = await completeMediaExtractionJob('media-processor', payload, env, repository);
  if (!result.ok) return { error: result.reason, message: result.message };

  return {
    payload: buildExtractionCallbackResponse(result.extraction, result.pipeline),
  };
}
