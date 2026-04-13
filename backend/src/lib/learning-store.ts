import type { D1Database } from '@cloudflare/workers-types';
import { demoCourses, demoEnrollments, demoLectureProgress, demoLectures } from '@myway/shared/data/courses';
import { demoAudioExtractions, demoLectureNotes, demoLecturePipelines, demoLectureTranscripts, demoMaterials, demoNotices } from '@myway/shared/data/media';
import type {
  AudioExtraction,
  CourseDetail,
  Enrollment,
  Lecture,
  LectureNote,
  LecturePipeline,
  LectureProgress,
  LectureTranscript,
  Material,
  Notice,
} from '@myway/shared';
import type { RuntimeBindings } from './runtime-env';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const seedDemoCourses = clone(demoCourses);
const seedDemoLectures = clone(demoLectures);
const seedDemoMaterials = clone(demoMaterials);
const seedDemoNotices = clone(demoNotices);
const seedDemoLectureTranscripts = clone(demoLectureTranscripts);
const seedDemoLectureNotes = clone(demoLectureNotes);
const seedDemoAudioExtractions = clone(demoAudioExtractions);
const seedDemoLecturePipelines = clone(demoLecturePipelines);
const seedDemoEnrollments = clone(demoEnrollments);
const seedDemoLectureProgress = clone(demoLectureProgress);

type CourseRow = {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  is_published: number;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

type LectureRow = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  week_number: number | null;
  session_number: number | null;
  content_type: string;
  content_text: string;
  duration_minutes: number;
  is_published: number;
  video_url?: string | null;
  video_asset_key?: string | null;
  created_at: string;
  updated_at: string;
};

type TranscriptDurationRow = {
  lecture_id: string;
  duration_ms: number;
  created_at: string;
};

type ExtractionDurationRow = {
  lecture_id: string;
  audio_duration_ms: number;
  created_at: string;
};

type MaterialRow = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
};

type NoticeRow = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  pinned: number;
  author_id: string;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  created_at: string | null;
  updated_at: string;
};

type LectureProgressRow = {
  id: string;
  user_id: string;
  lecture_id: string;
  is_completed: number;
  completed_at: string | null;
  updated_at: string | null;
};

type TranscriptRow = {
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

type NoteRow = {
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

type ExtractionRow = {
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

type PipelineRow = {
  lecture_id: string;
  transcript_status: LecturePipeline['transcript_status'];
  summary_status: LecturePipeline['summary_status'];
  audio_status: LecturePipeline['audio_status'];
  transcript_id: string | null;
  note_id: string | null;
  extraction_id: string | null;
  updated_at: string;
};

let learningStoreReady = false;
let learningStorePromise: Promise<void> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function toBoolean(value: number): boolean {
  return value === 1;
}

function toNumber(value: boolean): number {
  return value ? 1 : 0;
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
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

function upsertById<T extends { id: string }>(items: T[], item: T): void {
  const index = items.findIndex((current) => current.id === item.id);
  if (index >= 0) {
    items[index] = item;
    return;
  }

  items.push(item);
}

function upsertPipelineByLectureId(items: LecturePipeline[], item: LecturePipeline): void {
  const index = items.findIndex((current) => current.lecture_id === item.lecture_id);
  if (index >= 0) {
    items[index] = item;
    return;
  }

  items.push(item);
}

function ensureLectureContentType(value: string): Lecture['content_type'] {
  return value === 'text' ? 'text' : 'video';
}

function resolveDurationMinutes(durationMs: number): number {
  return Math.max(1, Math.ceil(durationMs / 60_000));
}

function resetMemoryState(): void {
  demoCourses.splice(0, demoCourses.length, ...clone(seedDemoCourses));
  demoLectures.splice(0, demoLectures.length, ...clone(seedDemoLectures));
  demoMaterials.splice(0, demoMaterials.length, ...clone(seedDemoMaterials));
  demoNotices.splice(0, demoNotices.length, ...clone(seedDemoNotices));
  demoLectureTranscripts.splice(0, demoLectureTranscripts.length, ...clone(seedDemoLectureTranscripts));
  demoLectureNotes.splice(0, demoLectureNotes.length, ...clone(seedDemoLectureNotes));
  demoAudioExtractions.splice(0, demoAudioExtractions.length, ...clone(seedDemoAudioExtractions));
  demoLecturePipelines.splice(0, demoLecturePipelines.length, ...clone(seedDemoLecturePipelines));
  demoEnrollments.splice(0, demoEnrollments.length, ...clone(seedDemoEnrollments));
  demoLectureProgress.splice(0, demoLectureProgress.length, ...clone(seedDemoLectureProgress));
}

function mapLectureRow(row: LectureRow): Lecture {
  const lecture = demoLectures.find((item) => item.id === row.id);
  return {
    ...(lecture ?? {
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      order_index: row.order_index,
      week_number: row.week_number ?? undefined,
      session_number: row.session_number ?? undefined,
      content_type: ensureLectureContentType(row.content_type),
      content_text: row.content_text,
      duration_minutes: row.duration_minutes,
      is_published: toBoolean(row.is_published),
    }),
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    order_index: row.order_index,
    week_number: row.week_number ?? undefined,
    session_number: row.session_number ?? undefined,
    content_type: ensureLectureContentType(row.content_type),
    content_text: row.content_text,
    duration_minutes: row.duration_minutes,
    is_published: toBoolean(row.is_published),
    video_url: row.video_url ?? undefined,
    video_asset_key: row.video_asset_key ?? undefined,
  };
}

function syncLectureDurationMemory(lectureId: string, durationMinutes: number): void {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (lecture) {
    lecture.duration_minutes = durationMinutes;
  }
}

async function updateLectureDuration(db: D1Database, lectureId: string, durationMinutes: number): Promise<void> {
  const timestamp = nowIso();
  await db
    .prepare('UPDATE lectures SET duration_minutes = ?, updated_at = ? WHERE id = ?')
    .bind(durationMinutes, timestamp, lectureId)
    .run();
}

async function syncLectureDurationsFromMedia(db: D1Database): Promise<void> {
  const [transcriptRows, extractionRows] = await Promise.all([
    db
      .prepare('SELECT lecture_id, duration_ms, created_at FROM lecture_transcripts ORDER BY created_at DESC, id DESC')
      .all<TranscriptDurationRow>(),
    db
      .prepare('SELECT lecture_id, audio_duration_ms, created_at FROM audio_extractions ORDER BY created_at DESC, id DESC')
      .all<ExtractionDurationRow>(),
  ]);

  const resolved = new Map<string, number>();

  for (const row of transcriptRows.results) {
    if (resolved.has(row.lecture_id) || row.duration_ms <= 0) {
      continue;
    }

    resolved.set(row.lecture_id, resolveDurationMinutes(row.duration_ms));
  }

  for (const row of extractionRows.results) {
    if (resolved.has(row.lecture_id) || row.audio_duration_ms <= 0) {
      continue;
    }

    resolved.set(row.lecture_id, resolveDurationMinutes(row.audio_duration_ms));
  }

  for (const [lectureId, durationMinutes] of resolved.entries()) {
    await updateLectureDuration(db, lectureId, durationMinutes);
    syncLectureDurationMemory(lectureId, durationMinutes);
  }
}

function mapMaterialRow(row: MaterialRow): Material {
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

function mapNoticeRow(row: NoticeRow): Notice {
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

function mapEnrollmentRow(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id,
    status: row.status as Enrollment['status'],
    progress_percent: row.progress_percent,
    created_at: row.created_at ?? undefined,
  };
}

function mapLectureProgressRow(row: LectureProgressRow): LectureProgress {
  return {
    id: row.id,
    user_id: row.user_id,
    lecture_id: row.lecture_id,
    is_completed: toBoolean(row.is_completed),
    completed_at: row.completed_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

function mapTranscriptRow(row: TranscriptRow): LectureTranscript {
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

function mapNoteRow(row: NoteRow): LectureNote {
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

function mapExtractionRow(row: ExtractionRow): AudioExtraction {
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

function mapPipelineRow(row: PipelineRow): LecturePipeline {
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

async function ensureSchema(db: D1Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      instructor_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      is_published INTEGER NOT NULL,
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);

    CREATE TABLE IF NOT EXISTS lectures (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      week_number INTEGER,
      session_number INTEGER,
      content_type TEXT NOT NULL,
      content_text TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      is_published INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_lectures_course_id_order ON lectures(course_id, order_index);

    CREATE TABLE IF NOT EXISTS course_materials (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      file_name TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_course_materials_course_id_uploaded_at ON course_materials(course_id, uploaded_at DESC);

    CREATE TABLE IF NOT EXISTS course_notices (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      pinned INTEGER NOT NULL,
      author_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_course_notices_course_id_created_at ON course_notices(course_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_percent INTEGER NOT NULL,
      created_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, course_id)
    );
    CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

    CREATE TABLE IF NOT EXISTS lecture_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lecture_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL,
      completed_at TEXT,
      updated_at TEXT,
      UNIQUE(user_id, lecture_id)
    );
    CREATE INDEX IF NOT EXISTS idx_lecture_progress_user_id ON lecture_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture_id ON lecture_progress(lecture_id);
  `);

  const lectureColumns = await db.prepare('PRAGMA table_info(lectures)').all<{ name: string }>();
  const columnNames = new Set(lectureColumns.results.map((column) => column.name));
  if (!columnNames.has('video_url')) {
    await db.exec('ALTER TABLE lectures ADD COLUMN video_url TEXT');
  }

  if (!columnNames.has('video_asset_key')) {
    await db.exec('ALTER TABLE lectures ADD COLUMN video_asset_key TEXT');
  }
}

async function seedCourseData(db: D1Database): Promise<void> {
  const existing = await db.prepare('SELECT id FROM courses LIMIT 1').first<{ id: string }>();
  if (existing) {
    return;
  }

  const seededAt = nowIso();
  for (const course of demoCourses) {
    await db
      .prepare(
        'INSERT INTO courses (id, instructor_id, title, description, category, difficulty, is_published, tags_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        course.id,
        course.instructor_id,
        course.title,
        course.description,
        course.category,
        course.difficulty,
        toNumber(course.is_published),
        JSON.stringify(course.tags),
        seededAt,
        seededAt,
      )
      .run();
  }

  for (const lecture of demoLectures) {
    await db
      .prepare(
        'INSERT INTO lectures (id, course_id, title, order_index, week_number, session_number, content_type, content_text, duration_minutes, is_published, video_url, video_asset_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        lecture.id,
        lecture.course_id,
        lecture.title,
        lecture.order_index,
        lecture.week_number ?? null,
        lecture.session_number ?? null,
        lecture.content_type,
        lecture.content_text,
        lecture.duration_minutes,
        toNumber(lecture.is_published),
        lecture.video_url ?? null,
        lecture.video_asset_key ?? null,
        seededAt,
        seededAt,
      )
      .run();
  }

  for (const material of demoMaterials) {
    await db
      .prepare(
        'INSERT INTO course_materials (id, course_id, title, summary, file_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(material.id, material.course_id, material.title, material.summary, material.file_name, material.uploaded_by, material.uploaded_at)
      .run();
  }

  for (const notice of demoNotices) {
    await db
      .prepare(
        'INSERT INTO course_notices (id, course_id, title, content, pinned, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(notice.id, notice.course_id, notice.title, notice.content, toNumber(notice.pinned), notice.author_id, notice.created_at)
      .run();
  }

  for (const enrollment of demoEnrollments) {
    await db
      .prepare(
        'INSERT INTO enrollments (id, user_id, course_id, status, progress_percent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, course_id) DO UPDATE SET id = excluded.id, status = excluded.status, progress_percent = excluded.progress_percent, created_at = excluded.created_at, updated_at = excluded.updated_at',
      )
      .bind(enrollment.id, enrollment.user_id, enrollment.course_id, enrollment.status, enrollment.progress_percent, enrollment.created_at ?? seededAt, seededAt)
      .run();
  }

  for (const progress of demoLectureProgress) {
    await db
      .prepare(
        'INSERT INTO lecture_progress (id, user_id, lecture_id, is_completed, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, lecture_id) DO UPDATE SET id = excluded.id, is_completed = excluded.is_completed, completed_at = excluded.completed_at, updated_at = excluded.updated_at',
      )
      .bind(progress.id, progress.user_id, progress.lecture_id, toNumber(progress.is_completed), progress.completed_at ?? null, progress.updated_at ?? null)
      .run();
  }
}

async function seedMediaData(db: D1Database): Promise<void> {
  if (
    seedDemoLectureTranscripts.length === 0 &&
    seedDemoLectureNotes.length === 0 &&
    seedDemoAudioExtractions.length === 0 &&
    seedDemoLecturePipelines.length === 0
  ) {
    return;
  }

  const lectureIds = new Set<string>([
    ...seedDemoLectureTranscripts.map((item) => item.lecture_id),
    ...seedDemoLectureNotes.map((item) => item.lecture_id),
    ...seedDemoAudioExtractions.map((item) => item.lecture_id),
    ...seedDemoLecturePipelines.map((item) => item.lecture_id),
  ]);

  for (const lectureId of lectureIds) {
    await Promise.all([
      db.prepare('DELETE FROM lecture_transcripts WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM lecture_notes WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM audio_extractions WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM lecture_pipelines WHERE lecture_id = ?').bind(lectureId).run(),
    ]);
  }

  for (const transcript of seedDemoLectureTranscripts) {
    await db
      .prepare(
        'INSERT INTO lecture_transcripts (id, lecture_id, user_id, language, full_text, segments_json, word_count, duration_ms, stt_provider, stt_model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        transcript.id,
        transcript.lecture_id,
        transcript.user_id,
        transcript.language,
        transcript.full_text,
        JSON.stringify(transcript.segments),
        transcript.word_count,
        transcript.duration_ms,
        transcript.stt_provider,
        transcript.stt_model,
        transcript.created_at,
      )
      .run();
  }

  for (const note of seedDemoLectureNotes) {
    await db
      .prepare(
        'INSERT INTO lecture_notes (id, lecture_id, user_id, note_type, title, content, key_concepts_json, keywords_json, timestamps_json, language, ai_model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        note.id,
        note.lecture_id,
        note.user_id,
        note.note_type,
        note.title,
        note.content,
        JSON.stringify(note.key_concepts),
        JSON.stringify(note.keywords),
        note.timestamps ? JSON.stringify(note.timestamps) : null,
        note.language,
        note.ai_model,
        note.created_at,
      )
      .run();
  }

  for (const extraction of seedDemoAudioExtractions) {
    await db
      .prepare(
        'INSERT INTO audio_extractions (id, lecture_id, user_id, source_type, source_url, source_video_key, source_video_name, source_content_type, source_size_bytes, language, requested_stt_provider, requested_stt_model, processing_job_id, processing_error, audio_url, audio_format, audio_duration_ms, sample_rate, channels, status, transcript_id, stt_status, created_at, processed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        extraction.id,
        extraction.lecture_id,
        extraction.user_id,
        extraction.source_type,
        extraction.source_url,
        extraction.source_video_key ?? null,
        extraction.source_video_name ?? null,
        extraction.source_content_type ?? null,
        extraction.source_size_bytes ?? null,
        extraction.language ?? null,
        extraction.requested_stt_provider ?? null,
        extraction.requested_stt_model ?? null,
        extraction.processing_job_id ?? null,
        extraction.processing_error ?? null,
        extraction.audio_url ?? null,
        extraction.audio_format,
        extraction.audio_duration_ms,
        extraction.sample_rate,
        extraction.channels,
        extraction.status,
        extraction.transcript_id ?? null,
        extraction.stt_status,
        extraction.created_at,
        extraction.processed_at ?? null,
        extraction.updated_at,
      )
      .run();
  }

  for (const pipeline of seedDemoLecturePipelines) {
    await db
      .prepare(
        'INSERT INTO lecture_pipelines (lecture_id, transcript_status, summary_status, audio_status, transcript_id, note_id, extraction_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(lecture_id) DO UPDATE SET transcript_status = excluded.transcript_status, summary_status = excluded.summary_status, audio_status = excluded.audio_status, transcript_id = excluded.transcript_id, note_id = excluded.note_id, extraction_id = excluded.extraction_id, updated_at = excluded.updated_at',
      )
      .bind(
        pipeline.lecture_id,
        pipeline.transcript_status,
        pipeline.summary_status,
        pipeline.audio_status,
        pipeline.transcript_id ?? null,
        pipeline.note_id ?? null,
        pipeline.extraction_id ?? null,
        pipeline.updated_at,
      )
      .run();
  }
}

async function hydrateMemory(db: D1Database): Promise<void> {
  const [courseRows, lectureRows, materialRows, noticeRows, enrollmentRows, progressRows, transcriptRows, noteRows, extractionRows, pipelineRows] = await Promise.all([
    db.prepare('SELECT * FROM courses ORDER BY created_at ASC, id ASC').all<CourseRow>(),
    db.prepare('SELECT * FROM lectures ORDER BY course_id ASC, order_index ASC, id ASC').all<LectureRow>(),
    db.prepare('SELECT * FROM course_materials ORDER BY uploaded_at DESC, id ASC').all<MaterialRow>(),
    db.prepare('SELECT * FROM course_notices ORDER BY pinned DESC, created_at DESC, id ASC').all<NoticeRow>(),
    db.prepare('SELECT * FROM enrollments ORDER BY created_at ASC, id ASC').all<EnrollmentRow>(),
    db.prepare('SELECT * FROM lecture_progress ORDER BY updated_at DESC, id ASC').all<LectureProgressRow>(),
    db.prepare('SELECT * FROM lecture_transcripts ORDER BY created_at ASC, id ASC').all<TranscriptRow>(),
    db.prepare('SELECT * FROM lecture_notes ORDER BY created_at ASC, id ASC').all<NoteRow>(),
    db.prepare('SELECT * FROM audio_extractions ORDER BY created_at ASC, id ASC').all<ExtractionRow>(),
    db.prepare('SELECT * FROM lecture_pipelines ORDER BY updated_at ASC, lecture_id ASC').all<PipelineRow>(),
  ]);

  for (const row of courseRows.results) {
    upsertById(demoCourses, {
      id: row.id,
      instructor_id: row.instructor_id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty as CourseDetail['difficulty'],
      is_published: toBoolean(row.is_published),
      tags: parseTags(row.tags_json),
    });
  }

  for (const row of lectureRows.results) {
    upsertById(demoLectures, mapLectureRow(row));
  }

  for (const row of materialRows.results) {
    upsertById(demoMaterials, mapMaterialRow(row));
  }

  for (const row of noticeRows.results) {
    upsertById(demoNotices, mapNoticeRow(row));
  }

  for (const row of enrollmentRows.results) {
    upsertById(demoEnrollments, mapEnrollmentRow(row));
  }

  for (const row of progressRows.results) {
    upsertById(demoLectureProgress, mapLectureProgressRow(row));
  }

  for (const row of transcriptRows.results) {
    upsertById(demoLectureTranscripts, mapTranscriptRow(row));
  }

  for (const row of noteRows.results) {
    upsertById(demoLectureNotes, mapNoteRow(row));
  }

  for (const row of extractionRows.results) {
    upsertById(demoAudioExtractions, mapExtractionRow(row));
  }

  for (const row of pipelineRows.results) {
    upsertPipelineByLectureId(demoLecturePipelines, mapPipelineRow(row));
  }
}

async function upsertCourse(db: D1Database, detail: CourseDetail): Promise<void> {
  const timestamp = nowIso();
  await db
    .prepare(
      'INSERT INTO courses (id, instructor_id, title, description, category, difficulty, is_published, tags_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET instructor_id = excluded.instructor_id, title = excluded.title, description = excluded.description, category = excluded.category, difficulty = excluded.difficulty, is_published = excluded.is_published, tags_json = excluded.tags_json, updated_at = excluded.updated_at',
    )
    .bind(
      detail.id,
      detail.instructor_id,
      detail.title,
      detail.description,
      detail.category,
      detail.difficulty,
      toNumber(detail.is_published),
      JSON.stringify(detail.tags),
      timestamp,
      timestamp,
    )
    .run();
}

async function upsertLecture(db: D1Database, lecture: Lecture): Promise<void> {
  const timestamp = nowIso();
  await db
    .prepare(
      'INSERT INTO lectures (id, course_id, title, order_index, week_number, session_number, content_type, content_text, duration_minutes, is_published, video_url, video_asset_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, order_index = excluded.order_index, week_number = excluded.week_number, session_number = excluded.session_number, content_type = excluded.content_type, content_text = excluded.content_text, duration_minutes = excluded.duration_minutes, is_published = excluded.is_published, video_url = excluded.video_url, video_asset_key = excluded.video_asset_key, updated_at = excluded.updated_at',
    )
    .bind(
      lecture.id,
      lecture.course_id,
      lecture.title,
      lecture.order_index,
      lecture.week_number ?? null,
      lecture.session_number ?? null,
      lecture.content_type,
      lecture.content_text,
      lecture.duration_minutes,
      toNumber(lecture.is_published),
      lecture.video_url ?? null,
      lecture.video_asset_key ?? null,
      timestamp,
      timestamp,
    )
    .run();
}

async function updateLectureVideoAsset(db: D1Database, lectureId: string, videoUrl: string, videoAssetKey: string): Promise<void> {
  const timestamp = nowIso();
  await db
    .prepare('UPDATE lectures SET video_url = ?, video_asset_key = ?, updated_at = ? WHERE id = ?')
    .bind(videoUrl, videoAssetKey, timestamp, lectureId)
    .run();
}

async function upsertMaterial(db: D1Database, material: Material): Promise<void> {
  await db
    .prepare(
      'INSERT INTO course_materials (id, course_id, title, summary, file_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, summary = excluded.summary, file_name = excluded.file_name, uploaded_by = excluded.uploaded_by, uploaded_at = excluded.uploaded_at',
    )
    .bind(material.id, material.course_id, material.title, material.summary, material.file_name, material.uploaded_by, material.uploaded_at)
    .run();
}

async function upsertNotice(db: D1Database, notice: Notice): Promise<void> {
  await db
    .prepare(
      'INSERT INTO course_notices (id, course_id, title, content, pinned, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, content = excluded.content, pinned = excluded.pinned, author_id = excluded.author_id, created_at = excluded.created_at',
    )
    .bind(notice.id, notice.course_id, notice.title, notice.content, toNumber(notice.pinned), notice.author_id, notice.created_at)
    .run();
}

async function upsertEnrollment(db: D1Database, enrollment: Enrollment): Promise<void> {
  const updatedAt = nowIso();
  await db
    .prepare(
      'INSERT INTO enrollments (id, user_id, course_id, status, progress_percent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, course_id) DO UPDATE SET id = excluded.id, status = excluded.status, progress_percent = excluded.progress_percent, created_at = excluded.created_at, updated_at = excluded.updated_at',
    )
    .bind(
      enrollment.id,
      enrollment.user_id,
      enrollment.course_id,
      enrollment.status,
      enrollment.progress_percent,
      enrollment.created_at ?? updatedAt,
      updatedAt,
    )
    .run();
}

async function upsertProgress(db: D1Database, progress: LectureProgress): Promise<void> {
  await db
    .prepare(
      'INSERT INTO lecture_progress (id, user_id, lecture_id, is_completed, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, lecture_id) DO UPDATE SET id = excluded.id, is_completed = excluded.is_completed, completed_at = excluded.completed_at, updated_at = excluded.updated_at',
    )
    .bind(progress.id, progress.user_id, progress.lecture_id, toNumber(progress.is_completed), progress.completed_at ?? null, progress.updated_at ?? null)
    .run();
}

export async function ensureLearningStore(env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  if (learningStoreReady) {
    return;
  }

  if (!learningStorePromise) {
    learningStorePromise = (async () => {
      await ensureSchema(db);
      await seedCourseData(db);
      await seedMediaData(db);
      await hydrateMemory(db);
      await syncLectureDurationsFromMedia(db);
      learningStoreReady = true;
    })().catch((error) => {
      learningStorePromise = null;
      throw error;
    });
  }

  await learningStorePromise;
}

export async function reloadLearningStore(env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  learningStoreReady = false;
  learningStorePromise = null;
  await ensureLearningStore(env);
}

export async function refreshLearningStoreFromDatabase(env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  learningStoreReady = false;
  learningStorePromise = null;
  resetMemoryState();

  if (!learningStorePromise) {
    learningStorePromise = (async () => {
      await ensureSchema(db);
      await seedCourseData(db);
      await seedMediaData(db);
      await hydrateMemory(db);
      await syncLectureDurationsFromMedia(db);
      learningStoreReady = true;
    })().catch((error) => {
      learningStorePromise = null;
      throw error;
    });
  }

  await learningStorePromise;
}

export async function persistCourseDetail(detail: CourseDetail, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await upsertCourse(db, detail);
  await Promise.all([
    ...detail.lectures.map((lecture) => upsertLecture(db, lecture)),
    ...detail.materials.map((material) => upsertMaterial(db, material)),
    ...detail.notices.map((notice) => upsertNotice(db, notice)),
  ]);
}

export async function persistEnrollment(enrollment: Enrollment, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await upsertEnrollment(db, enrollment);
}

export async function persistLectureProgress(userId: string, lectureId: string, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);

  const progress = demoLectureProgress.find((item) => item.user_id === userId && item.lecture_id === lectureId);
  if (progress) {
    await upsertProgress(db, progress);
  }

  const enrollment = demoEnrollments.find((item) => item.user_id === userId && item.course_id === demoLectures.find((lecture) => lecture.id === lectureId)?.course_id);
  if (enrollment) {
    await upsertEnrollment(db, enrollment);
  }
}

export async function persistLectureVideoAsset(
  lectureId: string,
  videoUrl: string,
  videoAssetKey: string,
  env?: RuntimeBindings,
): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await updateLectureVideoAsset(db, lectureId, videoUrl, videoAssetKey);

  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (lecture) {
    lecture.video_url = videoUrl;
    lecture.video_asset_key = videoAssetKey;
  }
}

export async function persistLectureDuration(
  lectureId: string,
  durationMinutes: number,
  env?: RuntimeBindings,
): Promise<void> {
  const normalizedDuration = Math.max(1, Math.round(durationMinutes));
  const db = env?.MEDIA_DB;
  syncLectureDurationMemory(lectureId, normalizedDuration);

  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await updateLectureDuration(db, lectureId, normalizedDuration);
}
