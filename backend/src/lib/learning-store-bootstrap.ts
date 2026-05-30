import type { D1Database } from '@cloudflare/workers-types';
import type { AudioExtraction, Enrollment, Lecture, LectureNote, LecturePipeline, LectureProgress, LectureTranscript, Material, Notice } from '@myway/shared';

type BootstrapSeedData = {
  courses: Array<{
    id: string;
    instructor_id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    is_published: boolean;
    tags: string[];
  }>;
  lectures: Lecture[];
  materials: Material[];
  notices: Notice[];
  enrollments: Enrollment[];
  progress: LectureProgress[];
  transcripts: LectureTranscript[];
  notes: LectureNote[];
  extractions: AudioExtraction[];
  pipelines: LecturePipeline[];
};

function toNumber(value: boolean): number {
  return value ? 1 : 0;
}

export async function ensureLearningStoreSchema(db: D1Database): Promise<void> {
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

export async function seedLearningStoreCourseData(db: D1Database, seed: BootstrapSeedData): Promise<void> {
  const existing = await db.prepare('SELECT id FROM courses LIMIT 1').first<{ id: string }>();
  if (existing) return;

  const seededAt = new Date().toISOString();

  for (const course of seed.courses) {
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

  for (const lecture of seed.lectures) {
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

  for (const material of seed.materials) {
    await db
      .prepare('INSERT INTO course_materials (id, course_id, title, summary, file_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(material.id, material.course_id, material.title, material.summary, material.file_name, material.uploaded_by, material.uploaded_at)
      .run();
  }

  for (const notice of seed.notices) {
    await db
      .prepare('INSERT INTO course_notices (id, course_id, title, content, pinned, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(notice.id, notice.course_id, notice.title, notice.content, toNumber(notice.pinned), notice.author_id, notice.created_at)
      .run();
  }

  for (const enrollment of seed.enrollments) {
    await db
      .prepare(
        'INSERT INTO enrollments (id, user_id, course_id, status, progress_percent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, course_id) DO UPDATE SET id = excluded.id, status = excluded.status, progress_percent = excluded.progress_percent, created_at = excluded.created_at, updated_at = excluded.updated_at',
      )
      .bind(enrollment.id, enrollment.user_id, enrollment.course_id, enrollment.status, enrollment.progress_percent, enrollment.created_at ?? seededAt, seededAt)
      .run();
  }

  for (const progress of seed.progress) {
    await db
      .prepare(
        'INSERT INTO lecture_progress (id, user_id, lecture_id, is_completed, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, lecture_id) DO UPDATE SET id = excluded.id, is_completed = excluded.is_completed, completed_at = excluded.completed_at, updated_at = excluded.updated_at',
      )
      .bind(progress.id, progress.user_id, progress.lecture_id, toNumber(progress.is_completed), progress.completed_at ?? null, progress.updated_at ?? null)
      .run();
  }
}

export async function seedLearningStoreMediaData(db: D1Database, seed: BootstrapSeedData): Promise<void> {
  if (seed.transcripts.length === 0 && seed.notes.length === 0 && seed.extractions.length === 0 && seed.pipelines.length === 0) return;

  const lectureIds = new Set<string>([
    ...seed.transcripts.map((item) => item.lecture_id),
    ...seed.notes.map((item) => item.lecture_id),
    ...seed.extractions.map((item) => item.lecture_id),
    ...seed.pipelines.map((item) => item.lecture_id),
  ]);

  for (const lectureId of lectureIds) {
    await Promise.all([
      db.prepare('DELETE FROM lecture_transcripts WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM lecture_notes WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM audio_extractions WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM lecture_pipelines WHERE lecture_id = ?').bind(lectureId).run(),
    ]);
  }

  for (const transcript of seed.transcripts) {
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

  for (const note of seed.notes) {
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

  for (const extraction of seed.extractions) {
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

  for (const pipeline of seed.pipelines) {
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
