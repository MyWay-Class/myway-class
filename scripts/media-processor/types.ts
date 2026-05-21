export type CallbackConfig = {
  url: string;
  secret: string | null;
};

export type AudioExtractionJobRequest = {
  extraction_id: string;
  lecture_id: string;
  source_video_url: string;
  callback: CallbackConfig;
};

export type ShortformExportClipRequest = {
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
  order_index: number;
  source_video_url: string;
};

export type ShortformExportJobRequest = {
  shortform_id: string;
  course_id: string;
  title: string;
  description?: string;
  clips: ShortformExportClipRequest[];
  callback: CallbackConfig;
};

export type ProcessorConfig = {
  port: number;
  host: string;
  publicBaseUrl: string;
  workDir: string;
  token: string;
  callbackSecret: string | null;
  ffmpegPath: string;
};

export type ProcessorJob = {
  id: string;
  kind: 'audio-extraction' | 'shortform-export';
  extractionId: string;
  shortformId: string | null;
  lectureId: string;
  sourceVideoUrl: string;
  callbackUrl: string;
  callbackSecret: string | null;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage: 'queued' | 'downloading' | 'extracting' | 'composing' | 'callback' | 'completed' | 'failed';
  step: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  errorMessage: string | null;
  ffmpegOutput: string | null;
  callbackStatus: number | null;
  files: {
    videoPath: string | null;
    audioPath: string | null;
    outputPath: string | null;
    tempDir: string | null;
  };
  clips: ShortformExportClipRequest[];
};
