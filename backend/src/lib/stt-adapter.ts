import { createLectureTranscript, type TranscriptCreateRequest, type LecturePipeline, type MediaRepository } from '@myway/shared';
import { getSTTProviderSelection } from './stt-provider';
import { runCloudflareTranscription } from './providers';
import type { RuntimeBindings } from './runtime-env';

export const PUBLIC_STT_MAX_DURATION_MS = 180_000;

export type STTAdapterResult =
  | {
      ok: true;
      transcript_id: string;
      lecture_id: string;
      segment_count: number;
      duration_ms: number;
      word_count: number;
      stt_provider: string;
      stt_model: string;
      pipeline: LecturePipeline;
    }
  | {
      ok: false;
      reason: 'lecture_not_found' | 'transcript_failed' | 'input_too_large';
  };

export async function runTranscriptGeneration(
  userId: string,
  input: TranscriptCreateRequest,
  preferredProvider?: 'demo' | 'cloudflare' | 'gemini',
  env?: RuntimeBindings,
  repository?: MediaRepository,
): Promise<STTAdapterResult> {
  if (typeof input.duration_ms === 'number' && input.duration_ms > PUBLIC_STT_MAX_DURATION_MS) {
    return {
      ok: false,
      reason: 'input_too_large',
    };
  }

  const provider = getSTTProviderSelection('transcribe', preferredProvider);

  if (provider.current_provider === 'cloudflare' && input.audio_url) {
    const cloudflareResult = await runCloudflareTranscription(
      {
        audio_url: input.audio_url,
        language: input.language,
      },
      env,
    );

    if (cloudflareResult) {
      if (typeof cloudflareResult.duration_ms === 'number' && cloudflareResult.duration_ms > PUBLIC_STT_MAX_DURATION_MS) {
        return {
          ok: false,
          reason: 'input_too_large',
        };
      }

      const result = await createLectureTranscript(userId, {
        ...input,
        text: cloudflareResult.text,
        duration_ms: input.duration_ms ?? cloudflareResult.duration_ms,
        language: cloudflareResult.language ?? input.language,
        stt_provider: 'cloudflare',
        stt_model: cloudflareResult.model,
        segments: cloudflareResult.segments,
        word_count: cloudflareResult.word_count,
      }, repository);

      if (!result) {
        return {
          ok: false,
          reason: 'transcript_failed',
        };
      }

      return {
        ok: true,
        transcript_id: result.transcript.id,
        lecture_id: result.transcript.lecture_id,
        segment_count: result.transcript.segments.length,
        duration_ms: result.transcript.duration_ms,
        word_count: result.transcript.word_count,
        stt_provider: result.transcript.stt_provider,
        stt_model: result.transcript.stt_model,
        pipeline: result.pipeline,
      };
    }
  }

  const result = await createLectureTranscript(userId, {
    ...input,
    stt_provider: provider.current_provider,
    stt_model: input.stt_model ?? 'pseudo-stt-v1',
  }, repository);

  if (!result) {
    return {
      ok: false,
      reason: 'transcript_failed',
    };
  }

  return {
    ok: true,
    transcript_id: result.transcript.id,
    lecture_id: result.transcript.lecture_id,
    segment_count: result.transcript.segments.length,
    duration_ms: result.transcript.duration_ms,
    word_count: result.transcript.word_count,
    stt_provider: result.transcript.stt_provider,
    stt_model: result.transcript.stt_model,
    pipeline: result.pipeline,
  };
}
