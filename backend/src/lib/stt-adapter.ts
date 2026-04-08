import { createLectureTranscript, type TranscriptCreateRequest, type LecturePipeline } from '@myway/shared';
import { getSTTProviderSelection } from './stt-provider';

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

export function runTranscriptGeneration(
  userId: string,
  input: TranscriptCreateRequest,
  preferredProvider?: 'demo' | 'cloudflare' | 'gemini',
): STTAdapterResult {
  const provider = getSTTProviderSelection('transcribe', preferredProvider);
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
