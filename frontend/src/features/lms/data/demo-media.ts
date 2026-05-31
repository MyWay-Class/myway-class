import type { AudioExtraction, LecturePipeline, LectureTranscript, MediaProcessorHealth } from '@myway/shared';
import { demoUsers } from './demo-auth-courses';
import { demoLectureDetail } from './demo-learning';

const now = new Date().toISOString();

export const demoLectureTranscript: LectureTranscript = {
  id: 'trp_demo_ai_1',
  lecture_id: demoLectureDetail.id,
  user_id: demoUsers[3].id,
  language: 'ko',
  full_text: 'AI는 단순 자동완성이 아니라, 제품 흐름을 따라 기능을 연결하는 실행 파트너로 다뤄야 합니다. 전사와 타임스탬프는 복습을 더 빠르게 만들고, 숏폼은 학습 진입 장벽을 낮춥니다.',
  segments: [
    { index: 0, start_ms: 0, end_ms: 12000, text: 'AI는 단순 자동완성이 아니라, 제품 흐름을 따라 기능을 연결하는 실행 파트너로 다뤄야 합니다.' },
    { index: 1, start_ms: 12000, end_ms: 26000, text: '전사와 타임스탬프는 복습을 더 빠르게 만들고,' },
    { index: 2, start_ms: 26000, end_ms: 38000, text: '숏폼은 학습 진입 장벽을 낮춥니다.' },
  ],
  word_count: 28,
  duration_ms: 38000,
  stt_provider: 'cloudflare',
  stt_model: 'whisper-large-v3',
  created_at: now,
};

export const demoAudioExtraction: AudioExtraction = {
  id: 'ext_demo_ai_1',
  lecture_id: demoLectureDetail.id,
  user_id: demoUsers[0].id,
  source_type: 'video',
  source_url: demoLectureDetail.video_url,
  source_video_key: demoLectureDetail.video_asset_key,
  source_video_name: 'ai-orchestration-intro.mp4',
  source_content_type: 'video/mp4',
  source_size_bytes: 28_642_124,
  language: 'ko',
  requested_stt_provider: 'cloudflare',
  requested_stt_model: 'whisper-large-v3',
  processing_job_id: 'job_demo_001',
  processing_error: null,
  processing_stage: 'completed',
  processing_step: 'callback_done',
  audio_url: 'https://cdn.mywayclass.dev/demo/ai-orchestration-intro-audio.mp3',
  audio_format: 'mp3',
  audio_duration_ms: 38000,
  sample_rate: 48000,
  channels: 2,
  status: 'COMPLETED',
  transcript_id: demoLectureTranscript.id,
  stt_status: 'COMPLETED',
  created_at: now,
  processed_at: now,
  updated_at: now,
};

export const demoLecturePipeline: LecturePipeline = {
  lecture_id: demoLectureDetail.id,
  transcript_status: 'COMPLETED',
  summary_status: 'COMPLETED',
  audio_status: 'COMPLETED',
  transcript_id: demoLectureTranscript.id,
  note_id: 'note_demo_001',
  extraction_id: demoAudioExtraction.id,
  updated_at: now,
};

export const demoMediaProcessorHealth: MediaProcessorHealth = {
  ok: true,
  public_base_url: 'https://media-demo.mywayclass.dev',
  work_dir: '/workspace/media-processor',
  token_configured: true,
  callback_secret_configured: true,
  ffmpeg: {
    available: true,
    path: '/usr/bin/ffmpeg',
    version: '6.1',
    output: 'ffmpeg version 6.1',
  },
  jobs: {
    total: 12,
    processing: 1,
    completed: 10,
    failed: 1,
  },
  recent_jobs: [
    {
      id: 'job_demo_001',
      lecture_id: demoLectureDetail.id,
      status: 'COMPLETED',
      created_at: now,
      updated_at: now,
      audio_url: demoAudioExtraction.audio_url ?? null,
      error_message: null,
      stage: 'completed',
      step: 'callback_done',
      callback_status: 200,
    },
  ],
  updated_at: now,
};
