import type { AudioExtraction, LecturePipeline, LectureTranscript, MediaProcessorHealth, STTProviderCatalog } from '@myway/shared';

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

export type MediaPipelineInputs = {
  lectureId: string;
  sessionToken?: string | null;
};

export type MediaPipelineSnapshot = {
  pipeline: LecturePipeline | null;
  extractions: AudioExtraction[];
  transcript: LectureTranscript | null;
  providers: STTProviderCatalog | null;
  processorHealth: MediaProcessorHealth | null;
  speakerReview: TranscriptSpeakerReview | null;
};
