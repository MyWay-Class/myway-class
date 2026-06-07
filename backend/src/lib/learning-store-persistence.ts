import type { D1Database } from '@cloudflare/workers-types';
import type { CourseDetail, Enrollment, Lecture, LectureProgress, Material, Notice } from '@myway/shared';

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: boolean): number {
  return value ? 1 : 0;
}

export async function updateLectureDuration(db: D1Database, lectureId: string, durationMinutes: number): Promise<void> {
  const timestamp = nowIso();
  await db.prepare('UPDATE lectures SET duration_minutes = ?, updated_at = ? WHERE id = ?').bind(durationMinutes, timestamp, lectureId).run();
}

async function upsertCourse(db: D1Database, detail: CourseDetail): Promise<void> {
  const timestamp = nowIso();
  await db
    .prepare('INSERT INTO courses (id, instructor_id, title, description, category, difficulty, is_published, tags_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET instructor_id = excluded.instructor_id, title = excluded.title, description = excluded.description, category = excluded.category, difficulty = excluded.difficulty, is_published = excluded.is_published, tags_json = excluded.tags_json, updated_at = excluded.updated_at')
    .bind(detail.id, detail.instructor_id, detail.title, detail.description, detail.category, detail.difficulty, toNumber(detail.is_published), JSON.stringify(detail.tags), timestamp, timestamp)
    .run();
}

async function upsertLecture(db: D1Database, lecture: Lecture): Promise<void> {
  const timestamp = nowIso();
  await db
    .prepare('INSERT INTO lectures (id, course_id, title, order_index, week_number, session_number, content_type, content_text, duration_minutes, is_published, video_url, video_asset_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, order_index = excluded.order_index, week_number = excluded.week_number, session_number = excluded.session_number, content_type = excluded.content_type, content_text = excluded.content_text, duration_minutes = excluded.duration_minutes, is_published = excluded.is_published, video_url = excluded.video_url, video_asset_key = excluded.video_asset_key, updated_at = excluded.updated_at')
    .bind(lecture.id, lecture.course_id, lecture.title, lecture.order_index, lecture.week_number ?? null, lecture.session_number ?? null, lecture.content_type, lecture.content_text, lecture.duration_minutes, toNumber(lecture.is_published), lecture.video_url ?? null, lecture.video_asset_key ?? null, timestamp, timestamp)
    .run();
}

async function upsertMaterial(db: D1Database, material: Material): Promise<void> {
  await db
    .prepare('INSERT INTO course_materials (id, course_id, title, summary, file_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, summary = excluded.summary, file_name = excluded.file_name, uploaded_by = excluded.uploaded_by, uploaded_at = excluded.uploaded_at')
    .bind(material.id, material.course_id, material.title, material.summary, material.file_name, material.uploaded_by, material.uploaded_at)
    .run();
}

async function upsertNotice(db: D1Database, notice: Notice): Promise<void> {
  await db
    .prepare('INSERT INTO course_notices (id, course_id, title, content, pinned, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET course_id = excluded.course_id, title = excluded.title, content = excluded.content, pinned = excluded.pinned, author_id = excluded.author_id, created_at = excluded.created_at')
    .bind(notice.id, notice.course_id, notice.title, notice.content, toNumber(notice.pinned), notice.author_id, notice.created_at)
    .run();
}

export async function persistCourseDetailToDb(db: D1Database, detail: CourseDetail): Promise<void> {
  await upsertCourse(db, detail);
  await Promise.all([
    ...detail.lectures.map((lecture) => upsertLecture(db, lecture)),
    ...detail.materials.map((material) => upsertMaterial(db, material)),
    ...detail.notices.map((notice) => upsertNotice(db, notice)),
  ]);
}

export async function persistEnrollmentToDb(db: D1Database, enrollment: Enrollment): Promise<void> {
  const updatedAt = nowIso();
  await db
    .prepare('INSERT INTO enrollments (id, user_id, course_id, status, progress_percent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, course_id) DO UPDATE SET id = excluded.id, status = excluded.status, progress_percent = excluded.progress_percent, created_at = excluded.created_at, updated_at = excluded.updated_at')
    .bind(enrollment.id, enrollment.user_id, enrollment.course_id, enrollment.status, enrollment.progress_percent, enrollment.created_at ?? updatedAt, updatedAt)
    .run();
}

async function upsertProgress(db: D1Database, progress: LectureProgress): Promise<void> {
  await db
    .prepare('INSERT INTO lecture_progress (id, user_id, lecture_id, is_completed, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, lecture_id) DO UPDATE SET id = excluded.id, is_completed = excluded.is_completed, completed_at = excluded.completed_at, updated_at = excluded.updated_at')
    .bind(progress.id, progress.user_id, progress.lecture_id, toNumber(progress.is_completed), progress.completed_at ?? null, progress.updated_at ?? null)
    .run();
}

export async function persistProgressAndEnrollmentToDb(
  db: D1Database,
  progress: LectureProgress | undefined,
  enrollment: Enrollment | undefined,
): Promise<void> {
  if (progress) {
    await upsertProgress(db, progress);
  }
  if (enrollment) {
    await persistEnrollmentToDb(db, enrollment);
  }
}

export async function persistLectureVideoAssetToDb(
  db: D1Database,
  lectureId: string,
  videoUrl: string,
  videoAssetKey: string,
): Promise<void> {
  const timestamp = nowIso();
  await db.prepare('UPDATE lectures SET video_url = ?, video_asset_key = ?, updated_at = ? WHERE id = ?').bind(videoUrl, videoAssetKey, timestamp, lectureId).run();
}
