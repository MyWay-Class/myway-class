import type {
  AudioExtraction,
  Enrollment,
  LectureNote,
  LecturePipeline,
  LectureProgress,
  LectureTranscript,
  Material,
  Notice,
} from '@myway/shared';

export type MaterialRow = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type NoticeRow = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  pinned: number;
  author_id: string;
  created_at: string;
};

export type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  created_at: string | null;
  updated_at: string;
};

export type LectureProgressRow = {
  id: string;
  user_id: string;
  lecture_id: string;
  is_completed: number;
  completed_at: string | null;
  updated_at: string | null;
};

export type TranscriptRow = {
  id: string;
  lecture_id: string;
  user_id: string;
  language: string;
  full_text: string;
  segments_json: string;
  word_count: number;
  duration_ms: number;
  stt_provider: string;
  stt_model: string;
  created_at: string;
};

export type NoteRow = {
  id: string;
  lecture_id: string;
  user_id: string;
  note_type: LectureNote['note_type'];
  title: string;
  content: string;
  key_concepts_json: string;
  keywords_json: string;
  timestamps_json: string | null;
  language: string;
  ai_model: string;
  created_at: string;
};

export type ExtractionRow = {
  id: string;
  lecture_id: string;
  user_id: string;
  source_type: AudioExtraction['source_type'];
  source_url: string;
  source_video_key: string | null;
  source_video_name: string | null;
  source_content_type: string | null;
  source_size_bytes: number | null;
  language: string | null;
  requested_stt_provider: string | null;
  requested_stt_model: string | null;
  processing_job_id: string | null;
  processing_error: string | null;
  audio_url: string | null;
  audio_format: string;
  audio_duration_ms: number;
  sample_rate: number;
  channels: number;
  status: AudioExtraction['status'];
  transcript_id: string | null;
  stt_status: AudioExtraction['stt_status'];
  created_at: string;
  processed_at: string | null;
  updated_at: string;
};

export type PipelineRow = {
  lecture_id: string;
  transcript_status: LecturePipeline['transcript_status'];
  summary_status: LecturePipeline['summary_status'];
  audio_status: LecturePipeline['audio_status'];
  transcript_id: string | null;
  note_id: string | null;
  extraction_id: string | null;
  updated_at: string;
};

function toBoolean(value: number): boolean {
  return value === 1;
}

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function mapMaterialRow(row: MaterialRow): Material {
  return {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    summary: row.summary,
    file_name: row.file_name,
    uploaded_by: row.uploaded_by,
    uploaded_at: row.uploaded_at,
  };
}

export function mapNoticeRow(row: NoticeRow): Notice {
  return {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    content: row.content,
    pinned: toBoolean(row.pinned),
    author_id: row.author_id,
    created_at: row.created_at,
  };
}

export function mapEnrollmentRow(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id,
    status: row.status as Enrollment['status'],
    progress_percent: row.progress_percent,
    created_at: row.created_at ?? undefined,
  };
}

export function mapLectureProgressRow(row: LectureProgressRow): LectureProgress {
  return {
    id: row.id,
    user_id: row.user_id,
    lecture_id: row.lecture_id,
    is_completed: toBoolean(row.is_completed),
    completed_at: row.completed_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export function mapTranscriptRow(row: TranscriptRow): LectureTranscript {
  return {
    id: row.id,
    lecture_id: row.lecture_id,
    user_id: row.user_id,
    language: row.language,
    full_text: row.full_text,
    segments: parseJsonArray(row.segments_json),
    word_count: row.word_count,
    duration_ms: row.duration_ms,
    stt_provider: row.stt_provider,
    stt_model: row.stt_model,
    created_at: row.created_at,
  };
}

export function mapNoteRow(row: NoteRow): LectureNote {
  return {
    id: row.id,
    lecture_id: row.lecture_id,
    user_id: row.user_id,
    note_type: row.note_type,
    title: row.title,
    content: row.content,
    key_concepts: parseJsonArray(row.key_concepts_json),
    keywords: parseJsonArray(row.keywords_json),
    timestamps: row.timestamps_json ? parseJsonArray(row.timestamps_json) : null,
    language: row.language,
    ai_model: row.ai_model,
    created_at: row.created_at,
  };
}

export function mapExtractionRow(row: ExtractionRow): AudioExtraction {
  return {
    id: row.id,
    lecture_id: row.lecture_id,
    user_id: row.user_id,
    source_type: row.source_type,
    source_url: row.source_url,
    source_video_key: row.source_video_key ?? undefined,
    source_video_name: row.source_video_name ?? undefined,
    source_content_type: row.source_content_type ?? undefined,
    source_size_bytes: row.source_size_bytes ?? undefined,
    language: row.language ?? undefined,
    requested_stt_provider: row.requested_stt_provider ?? undefined,
    requested_stt_model: row.requested_stt_model ?? undefined,
    processing_job_id: row.processing_job_id,
    processing_error: row.processing_error,
    audio_url: row.audio_url,
    audio_format: row.audio_format,
    audio_duration_ms: row.audio_duration_ms,
    sample_rate: row.sample_rate,
    channels: row.channels,
    status: row.status,
    transcript_id: row.transcript_id,
    stt_status: row.stt_status,
    created_at: row.created_at,
    processed_at: row.processed_at,
    updated_at: row.updated_at,
  };
}

export function mapPipelineRow(row: PipelineRow): LecturePipeline {
  return {
    lecture_id: row.lecture_id,
    transcript_status: row.transcript_status,
    summary_status: row.summary_status,
    audio_status: row.audio_status,
    transcript_id: row.transcript_id,
    note_id: row.note_id,
    extraction_id: row.extraction_id,
    updated_at: row.updated_at,
  };
}
