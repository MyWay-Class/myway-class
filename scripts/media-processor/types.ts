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
  extractionId: string;
  lectureId: string;
  sourceVideoUrl: string;
  callbackUrl: string;
  callbackSecret: string | null;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage: 'queued' | 'downloading' | 'extracting' | 'callback' | 'completed' | 'failed';
  step: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  audioUrl: string | null;
  errorMessage: string | null;
  ffmpegOutput: string | null;
  callbackStatus: number | null;
  files: {
    videoPath: string | null;
    audioPath: string | null;
  };
};
