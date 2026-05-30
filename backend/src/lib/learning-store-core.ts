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
import {
  ensureLearningStoreSchema,
  seedLearningStoreCourseData,
  seedLearningStoreMediaData,
} from './learning-store-bootstrap';
import {
  mapEnrollmentRow,
  mapExtractionRow,
  mapLectureProgressRow,
  mapMaterialRow,
  mapNoteRow,
  mapNoticeRow,
  mapPipelineRow,
  mapTranscriptRow,
  type EnrollmentRow,
  type ExtractionRow,
  type LectureProgressRow,
  type MaterialRow,
  type NoteRow,
  type NoticeRow,
  type PipelineRow,
  type TranscriptRow,
} from './learning-store-mappers';

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
      await ensureLearningStoreSchema(db);
      await seedLearningStoreCourseData(db, {
        courses: demoCourses,
        lectures: demoLectures,
        materials: demoMaterials,
        notices: demoNotices,
        enrollments: demoEnrollments,
        progress: demoLectureProgress,
        transcripts: seedDemoLectureTranscripts,
        notes: seedDemoLectureNotes,
        extractions: seedDemoAudioExtractions,
        pipelines: seedDemoLecturePipelines,
      });
      await seedLearningStoreMediaData(db, {
        courses: demoCourses,
        lectures: demoLectures,
        materials: demoMaterials,
        notices: demoNotices,
        enrollments: demoEnrollments,
        progress: demoLectureProgress,
        transcripts: seedDemoLectureTranscripts,
        notes: seedDemoLectureNotes,
        extractions: seedDemoAudioExtractions,
        pipelines: seedDemoLecturePipelines,
      });
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
      await ensureLearningStoreSchema(db);
      await seedLearningStoreCourseData(db, {
        courses: demoCourses,
        lectures: demoLectures,
        materials: demoMaterials,
        notices: demoNotices,
        enrollments: demoEnrollments,
        progress: demoLectureProgress,
        transcripts: seedDemoLectureTranscripts,
        notes: seedDemoLectureNotes,
        extractions: seedDemoAudioExtractions,
        pipelines: seedDemoLecturePipelines,
      });
      await seedLearningStoreMediaData(db, {
        courses: demoCourses,
        lectures: demoLectures,
        materials: demoMaterials,
        notices: demoNotices,
        enrollments: demoEnrollments,
        progress: demoLectureProgress,
        transcripts: seedDemoLectureTranscripts,
        notes: seedDemoLectureNotes,
        extractions: seedDemoAudioExtractions,
        pipelines: seedDemoLecturePipelines,
      });
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
