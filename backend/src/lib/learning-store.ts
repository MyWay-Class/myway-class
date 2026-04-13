import type { D1Database } from '@cloudflare/workers-types';
import { demoCourses, demoEnrollments, demoLectureProgress, demoLectures } from '@myway/shared/data/courses';
import { demoMaterials, demoNotices } from '@myway/shared/data/media';
import type { CourseDetail, Enrollment, Lecture, LectureProgress, Material, Notice } from '@myway/shared';
import type { RuntimeBindings } from './runtime-env';

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
  created_at: string;
  updated_at: string;
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

function ensureLectureContentType(value: string): Lecture['content_type'] {
  return value === 'text' ? 'text' : 'video';
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
  };
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
        'INSERT INTO lectures (id, course_id, title, order_index, week_number, session_number, content_type, content_text, duration_minutes, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

async function hydrateMemory(db: D1Database): Promise<void> {
  const [courseRows, lectureRows, materialRows, noticeRows, enrollmentRows, progressRows] = await Promise.all([
    db.prepare('SELECT * FROM courses ORDER BY created_at ASC, id ASC').all<CourseRow>(),
    db.prepare('SELECT * FROM lectures ORDER BY course_id ASC, order_index ASC, id ASC').all<LectureRow>(),
    db.prepare('SELECT * FROM course_materials ORDER BY uploaded_at DESC, id ASC').all<MaterialRow>(),
    db.prepare('SELECT * FROM course_notices ORDER BY pinned DESC, created_at DESC, id ASC').all<NoticeRow>(),
    db.prepare('SELECT * FROM enrollments ORDER BY created_at ASC, id ASC').all<EnrollmentRow>(),
    db.prepare('SELECT * FROM lecture_progress ORDER BY updated_at DESC, id ASC').all<LectureProgressRow>(),
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
      'INSERT INTO lectures (id, course_id, title, order_index, week_number, session_number, content_type, content_text, duration_minutes, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, order_index = excluded.order_index, week_number = excluded.week_number, session_number = excluded.session_number, content_type = excluded.content_type, content_text = excluded.content_text, duration_minutes = excluded.duration_minutes, is_published = excluded.is_published, updated_at = excluded.updated_at',
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
      timestamp,
      timestamp,
    )
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
      await hydrateMemory(db);
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
