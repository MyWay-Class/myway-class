import type { AudioExtraction, LecturePipeline, LectureTranscript, MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';
import { getStoredAuth, request, type ApiRequestResult } from './api-core';

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
  audio_url?: string | null;
  processing_job_id?: string | null;
  processing_error?: string | null;
  pipeline: LecturePipeline;
};

export type LectureVideoMappingInput = {
  lecture_id: string;
  asset_key: string;
  video_url?: string;
};

export type LectureVideoMappingResult = {
  lecture_id: string;
  asset_key: string;
  video_url: string;
};

export type TranscriptSpeakerReview = {
  status: string;
  speaker_label?: string;
  instructor_name?: string;
  confidence?: number;
  note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
};

export type ApproveSttResult = {
  extraction_id: string;
  lecture_id: string;
  transcript: LectureTranscript;
  pipeline: LecturePipeline;
  stt_sync_policy: {
    mode: string;
    approval_state: string;
    overwrite_policy: string;
    notification_channel: string;
    decision: string;
  };
};

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

export async function loadMediaPipeline(lectureId: string, sessionToken?: string | null): Promise<LecturePipeline | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<LecturePipeline>(`/api/v1/media/pipeline/${encodeURIComponent(lectureId)}`, undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function loadAudioExtractions(lectureId: string, sessionToken?: string | null): Promise<AudioExtraction[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<AudioExtraction[]>(`/api/v1/media/audio-extractions/${encodeURIComponent(lectureId)}`, undefined, token);
  return response?.success && response.data ? response.data : [];
}

export async function loadLectureTranscriptDetailed(lectureId: string, sessionToken?: string | null): Promise<LectureTranscript | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<LectureTranscript>(`/api/v1/media/transcript/${encodeURIComponent(lectureId)}`, undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function loadTranscriptSpeakerReview(
  lectureId: string,
  sessionToken?: string | null,
): Promise<TranscriptSpeakerReview | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<TranscriptSpeakerReview>(
    `/api/v1/media/transcript/${encodeURIComponent(lectureId)}/speaker-review`,
    undefined,
    token,
  );
  return response?.success && response.data ? response.data : null;
}

export async function saveTranscriptSpeakerReviewDetailed(
  lectureId: string,
  input: {
    speaker_label?: string;
    instructor_name: string;
    confidence?: number;
    note?: string;
  },
  sessionToken?: string | null,
): Promise<ApiRequestResult<TranscriptSpeakerReview> | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  return await request<TranscriptSpeakerReview>(
    `/api/v1/media/transcript/${encodeURIComponent(lectureId)}/speaker-review`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function loadMediaProviders(sessionToken?: string | null): Promise<STTProviderCatalog | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<STTProviderCatalog>('/api/v1/media/providers', undefined, token);
  return response?.success && response.data ? response.data : null;
}

export async function loadMediaProcessorHealth(sessionToken?: string | null): Promise<MediaProcessorHealth | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<MediaProcessorHealth>('/api/v1/media/processor-health', undefined, token);
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
