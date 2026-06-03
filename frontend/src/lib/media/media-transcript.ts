import type { AudioExtraction, LecturePipeline, LectureTranscript } from '@myway/shared';
import { getStoredAuth, request, type ApiRequestResult } from '../api-core';
import type { TranscriptSpeakerReview } from './media-types';

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
  const response = await request<TranscriptSpeakerReview>(
    `/api/v1/media/transcript/${encodeURIComponent(lectureId)}/speaker-review`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
  return response;
}
