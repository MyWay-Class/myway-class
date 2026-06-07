import { demoEnrollments, demoLectureProgress, demoLectures } from '../../data/demo-data';
import type { Enrollment, LectureCompletionResult } from '../../types';
import { getCourseLectures } from './helpers';

function nowIso(): string {
  return new Date().toISOString();
}

export function completeLectureProgress(userId: string, lectureId: string): LectureCompletionResult {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return { ok: false, reason: 'lecture_not_found' };
  }

  const enrollment = demoEnrollments.find(
    (item) => item.user_id === userId && item.course_id === lecture.course_id && item.status === 'active',
  );

  if (!enrollment) {
    return { ok: false, reason: 'enrollment_required' };
  }

  const existingProgress = demoLectureProgress.find(
    (progress) => progress.user_id === userId && progress.lecture_id === lectureId,
  );

  if (existingProgress) {
    existingProgress.is_completed = true;
    existingProgress.completed_at = nowIso();
    existingProgress.updated_at = existingProgress.completed_at;
  } else {
    const completedAt = nowIso();
    demoLectureProgress.push({
      id: `prg_${String(demoLectureProgress.length + 1).padStart(3, '0')}`,
      user_id: userId,
      lecture_id: lectureId,
      is_completed: true,
      completed_at: completedAt,
      updated_at: completedAt,
    });
  }

  const courseLectures = getCourseLectures(lecture.course_id);
  const completedLectureIds = new Set(
    demoLectureProgress
      .filter((progress) => progress.user_id === userId && progress.is_completed)
      .map((progress) => progress.lecture_id),
  );

  const completedLectures = courseLectures.filter((item) => completedLectureIds.has(item.id)).length;
  const totalLectures = courseLectures.length;
  const progressPercent = totalLectures === 0 ? 0 : Math.round((completedLectures / totalLectures) * 100);

  enrollment.progress_percent = progressPercent;

  return {
    ok: true,
    lecture_id: lectureId,
    course_id: lecture.course_id,
    progress_percent: progressPercent,
    completed_lectures: completedLectures,
    total_lectures: totalLectures,
  };
}

export function enrollUser(userId: string, courseId: string): Enrollment {
  const existing = demoEnrollments.find(
    (enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId,
  );

  if (existing) {
    return existing;
  }

  const enrollment: Enrollment = {
    id: `enr_${String(demoEnrollments.length + 1).padStart(3, '0')}`,
    user_id: userId,
    course_id: courseId,
    status: 'active',
    progress_percent: 0,
    created_at: nowIso(),
  };

  demoEnrollments.push(enrollment);
  return enrollment;
}
