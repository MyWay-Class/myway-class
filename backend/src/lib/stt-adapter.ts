import { createLectureTranscript, type TranscriptCreateRequest, type LecturePipeline } from '@myway/shared';
import { getSTTProviderSelection } from './stt-provider';
import { runCloudflareTranscription } from './providers';
import type { RuntimeBindings } from './runtime-env';

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
      reason: 'lecture_not_found' | 'transcript_failed';
  };

export async function runTranscriptGeneration(
  userId: string,
  input: TranscriptCreateRequest,
  preferredProvider?: 'demo' | 'cloudflare' | 'gemini',
  env?: RuntimeBindings,
): Promise<STTAdapterResult> {
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
      const result = createLectureTranscript(userId, {
        ...input,
        text: cloudflareResult.text,
        duration_ms: input.duration_ms ?? cloudflareResult.duration_ms,
        language: cloudflareResult.language ?? input.language,
        stt_provider: 'cloudflare',
        stt_model: cloudflareResult.model,
        segments: cloudflareResult.segments,
        word_count: cloudflareResult.word_count,
      });

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

  const result = createLectureTranscript(userId, {
    ...input,
    stt_provider: provider.current_provider,
    stt_model: input.stt_model ?? 'pseudo-stt-v1',
  });

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
