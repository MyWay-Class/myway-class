import type { TranscriptSegment } from '@myway/shared';
import type { RuntimeBindings } from '../runtime-env';
import { getCloudflareSTTRuntimeSettings } from '../runtime-env';

type CloudflareAITranscriptionSegment = {
  start?: number;
  end?: number;
  text?: string;
};

type CloudflareAITranscriptionResult = {
  text?: string;
  word_count?: number;
  segments?: CloudflareAITranscriptionSegment[];
  transcription_info?: {
    language?: string;
    duration?: number;
  };
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 0x8000) {
    const chunk = bytes.subarray(index, index + 0x8000);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export type CloudflareTranscriptionOutput = {
  text: string;
  segments: TranscriptSegment[];
  word_count: number;
  duration_ms: number | undefined;
  language: string | undefined;
  model: string;
};

export async function runCloudflareTranscription(
  input: {
    audio_url: string;
    language?: string;
  },
  env?: RuntimeBindings,
): Promise<CloudflareTranscriptionOutput | null> {
  if (!env?.AI) {
    return null;
  }

  const audioResponse = await fetch(input.audio_url);
  if (!audioResponse.ok) {
    return null;
  }

  const audioBase64 = arrayBufferToBase64(await audioResponse.arrayBuffer());
  const { model } = getCloudflareSTTRuntimeSettings(env);
  const response = (await env.AI.run<{
    audio: string;
    task: 'transcribe';
    language?: string;
  }, CloudflareAITranscriptionResult>(model, {
    audio: audioBase64,
    task: 'transcribe',
    language: input.language,
  })) satisfies CloudflareAITranscriptionResult;

  const text = response.text?.trim();
  if (!text) {
    return null;
  }

  const segments = (response.segments ?? [])
    .map((segment, index) => ({
      index,
      start_ms: Math.max(0, Math.round((segment.start ?? 0) * 1000)),
      end_ms: Math.max(Math.round((segment.start ?? 0) * 1000), Math.round((segment.end ?? segment.start ?? 0) * 1000)),
      text: segment.text?.trim() ?? '',
    }))
    .filter((segment) => Boolean(segment.text));

  return {
    text,
    segments,
    word_count: response.word_count ?? text.split(/\s+/).filter(Boolean).length,
    duration_ms: response.transcription_info?.duration ? Math.round(response.transcription_info.duration * 1000) : undefined,
    language: response.transcription_info?.language ?? input.language,
    model,
  };
}
