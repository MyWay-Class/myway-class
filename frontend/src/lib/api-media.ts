import type { LecturePipeline, STTProviderCatalog } from '@myway/shared';
import { getStoredAuth, request } from './api-core';

export type MediaUploadResult = {
  lecture_id: string;
  asset_key: string;
  video_url: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
};

export type MediaExtractionResult = {
  extraction_id: string;
  lecture_id: string;
  audio_format: string;
  audio_duration_ms: number;
  sample_rate: number;
  channels: number;
  status: string;
  transcript_id: string | null;
  pipeline: LecturePipeline;
};

export async function uploadLectureVideo(lectureId: string, file: File, sessionToken?: string | null): Promise<MediaUploadResult | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const formData = new FormData();
  formData.append('lecture_id', lectureId);
  formData.append('video_file', file);

  const response = await request<MediaUploadResult>('/api/v1/media/upload-video', { method: 'POST', body: formData }, token);
  return response?.success && response.data ? response.data : null;
}

export async function createAudioExtraction(
  input: {
    lecture_id: string;
    video_url?: string;
    video_asset_key?: string;
    source_file_name?: string;
    source_content_type?: string;
    source_size_bytes?: number;
    audio_url?: string;
    language?: string;
    stt_provider?: string;
    stt_model?: string;
  },
  sessionToken?: string | null,
): Promise<MediaExtractionResult | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<MediaExtractionResult>('/api/v1/media/extract-audio', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);

  return response?.success && response.data ? response.data : null;
}

export async function loadMediaPipeline(lectureId: string, sessionToken?: string | null): Promise<LecturePipeline | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<LecturePipeline>(`/api/v1/media/pipeline/${encodeURIComponent(lectureId)}`, undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function loadMediaProviders(sessionToken?: string | null): Promise<STTProviderCatalog | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<STTProviderCatalog>('/api/v1/media/providers', undefined, token);
  return response?.success && response.data ? response.data : null;
}
