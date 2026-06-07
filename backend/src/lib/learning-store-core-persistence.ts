import type { CourseDetail, Enrollment } from '@myway/shared';
import { demoEnrollments, demoLectureProgress, demoLectures } from '@myway/shared/data/courses';
import type { RuntimeBindings } from './runtime-env';
import { ensureLearningStore } from './learning-store-core-state';
import {
  persistCourseDetailToDb,
  persistEnrollmentToDb,
  persistLectureVideoAssetToDb,
  persistProgressAndEnrollmentToDb,
  updateLectureDuration,
} from './learning-store-persistence';
import { syncLectureDurationMemory } from './learning-store-memory-state';

export async function persistCourseDetail(detail: CourseDetail, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await persistCourseDetailToDb(db, detail);
}

export async function persistEnrollment(enrollment: Enrollment, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await persistEnrollmentToDb(db, enrollment);
}

export async function persistLectureProgress(userId: string, lectureId: string, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);

  const progress = demoLectureProgress.find((item) => item.user_id === userId && item.lecture_id === lectureId);
  const enrollment = demoEnrollments.find((item) => item.user_id === userId && item.course_id === demoLectures.find((lecture) => lecture.id === lectureId)?.course_id);
  await persistProgressAndEnrollmentToDb(db, progress, enrollment);
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
  await persistLectureVideoAssetToDb(db, lectureId, videoUrl, videoAssetKey);

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
