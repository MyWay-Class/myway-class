CREATE TABLE IF NOT EXISTS lecture_transcripts (
  id TEXT PRIMARY KEY,
  lecture_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  language TEXT NOT NULL,
  full_text TEXT NOT NULL,
  segments_json TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  stt_provider TEXT NOT NULL,
  stt_model TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lecture_transcripts_lecture_id_created_at
  ON lecture_transcripts(lecture_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lecture_notes (
  id TEXT PRIMARY KEY,
  lecture_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  note_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  key_concepts_json TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  timestamps_json TEXT,
  language TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lecture_notes_lecture_id_created_at
  ON lecture_notes(lecture_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audio_extractions (
  id TEXT PRIMARY KEY,
  lecture_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_video_key TEXT,
  source_video_name TEXT,
  source_content_type TEXT,
  source_size_bytes INTEGER,
  language TEXT,
  requested_stt_provider TEXT,
  requested_stt_model TEXT,
  processing_job_id TEXT,
  processing_error TEXT,
  audio_url TEXT,
  audio_format TEXT NOT NULL,
  audio_duration_ms INTEGER NOT NULL,
  sample_rate INTEGER NOT NULL,
  channels INTEGER NOT NULL,
  status TEXT NOT NULL,
  transcript_id TEXT,
  stt_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audio_extractions_lecture_id_created_at
  ON audio_extractions(lecture_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audio_extractions_job
  ON audio_extractions(processing_job_id);

CREATE TABLE IF NOT EXISTS lecture_pipelines (
  lecture_id TEXT PRIMARY KEY,
  transcript_status TEXT NOT NULL,
  summary_status TEXT NOT NULL,
  audio_status TEXT NOT NULL,
  transcript_id TEXT,
  note_id TEXT,
  extraction_id TEXT,
  updated_at TEXT NOT NULL
);
