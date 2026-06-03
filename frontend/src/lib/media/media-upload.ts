import { getStoredAuth, request, type ApiRequestResult } from '../api-core';
import type { ApproveSttResult, LectureVideoMappingInput, LectureVideoMappingResult, MediaExtractionResult, MediaUploadResult } from './media-types';

export async function uploadLectureVideoDetailed(
  lectureId: string,
  file: File,
  sessionToken?: string | null,
): Promise<ApiRequestResult<MediaUploadResult> | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const formData = new FormData();
  formData.append('lecture_id', lectureId);
  formData.append('video_file', file);

  return await request<MediaUploadResult>('/api/v1/media/upload-video', { method: 'POST', body: formData }, token);
}

export async function uploadLectureVideo(lectureId: string, file: File, sessionToken?: string | null): Promise<MediaUploadResult | null> {
  const response = await uploadLectureVideoDetailed(lectureId, file, sessionToken);
  return response?.success && response.data ? response.data : null;
}

export async function createAudioExtractionDetailed(
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
): Promise<ApiRequestResult<MediaExtractionResult> | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  return await request<MediaExtractionResult>('/api/v1/media/extract-audio', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
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
  const response = await createAudioExtractionDetailed(input, sessionToken);
  return response?.success && response.data ? response.data : null;
}

export async function saveLectureVideoMappingDetailed(
  input: LectureVideoMappingInput,
  sessionToken?: string | null,
): Promise<ApiRequestResult<LectureVideoMappingResult> | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  return await request<LectureVideoMappingResult>('/api/v1/media/lecture-video', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
}

export async function approveSttExtractionDetailed(
  extractionId: string,
  input: {
    lecture_id: string;
    language?: string;
    duration_ms?: number;
    stt_provider?: string;
    stt_model?: string;
  },
  sessionToken?: string | null,
): Promise<ApiRequestResult<ApproveSttResult> | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  return await request<ApproveSttResult>(
    `/api/v1/media/extract-audio/${encodeURIComponent(extractionId)}/approve-stt`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}
