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
  createdAt: string;
  updatedAt: string;
  audioUrl: string | null;
  errorMessage: string | null;
  files: {
    videoPath: string | null;
    audioPath: string | null;
  };
};
