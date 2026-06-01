import type { D1Database } from '@cloudflare/workers-types';
import type { BootstrapSeedData } from './learning-store-bootstrap';

function toNumber(value: boolean): number {
  return value ? 1 : 0;
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
