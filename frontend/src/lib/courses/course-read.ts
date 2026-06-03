import {
  getCourseDetail,
  getDashboard,
  getLectureDetail,
  type CourseCard,
  type CourseDetail,
  type LectureDetail,
  type Material,
  type Notice,
} from '@myway/shared';
import { getFallbackUserId, getStoredAuth, request, unwrap } from '../api-core';
import { hydrateMissingLectureVideos, type EnrollmentItem } from './course-network';
import { mergeCourseDetailWithFallback, normalizeCourseId, normalizeLectureId } from './course-mappers';

export async function loadCourses(sessionToken?: string | null): Promise<CourseCard[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<CourseCard[]>('/api/v1/courses', undefined, token);
  const fallbackCourses = getDashboard(userId).courses;
  const sourceCourses = unwrap(response, () => fallbackCourses);

  const fallbackById = new Map(fallbackCourses.map((course) => [course.id, course]));
  const merged = sourceCourses.map((course) => {
    const fallback = fallbackById.get(course.id);
    return {
      ...fallback,
      ...course,
      enrolled: course.enrolled ?? fallback?.enrolled ?? false,
      tags: Array.isArray(course.tags) ? course.tags : (fallback?.tags ?? []),
      thumbnail_palette: course.thumbnail_palette ?? fallback?.thumbnail_palette ?? 'indigo',
      rating: Number.isFinite(course.rating) ? course.rating : (fallback?.rating ?? 0),
      student_count: Number.isFinite(course.student_count) ? course.student_count : (fallback?.student_count ?? 0),
      lecture_count: Number.isFinite(course.lecture_count) ? course.lecture_count : (fallback?.lecture_count ?? 0),
      total_duration_minutes: Number.isFinite(course.total_duration_minutes)
        ? course.total_duration_minutes
        : (fallback?.total_duration_minutes ?? 0),
    } as CourseCard;
  });

  if (!token) {
    return merged;
  }

  const enrollmentsResponse = await request<EnrollmentItem[]>('/api/v1/enrollments', undefined, token);
  if (!enrollmentsResponse?.success || !enrollmentsResponse.data) {
    return merged;
  }

  const enrolledCourseIds = new Set(enrollmentsResponse.data.map((item) => item.course_id));
  return merged.map((course) => ({ ...course, enrolled: enrolledCourseIds.has(course.id) }));
}

export async function loadManagedCourses(sessionToken?: string | null): Promise<CourseCard[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) {
    return [];
  }
  const response = await request<CourseCard[]>('/api/v1/courses/manage', undefined, token);
  return response?.success && response.data ? response.data : [];
}

export async function loadCourseDetail(courseId: string, sessionToken?: string | null): Promise<CourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const normalizedCourseId = normalizeCourseId(courseId);
  const response = await request<CourseDetail>(
    `/api/v1/courses/${encodeURIComponent(normalizedCourseId)}?userId=${encodeURIComponent(userId)}`,
    undefined,
    token,
  );
  const fallback = getCourseDetail(courseId, userId) ?? getCourseDetail(normalizedCourseId, userId);
  if (response?.success && response.data) {
    const merged = mergeCourseDetailWithFallback(response.data, fallback);
    return await hydrateMissingLectureVideos(merged, token);
  }
  return fallback ?? null;
}

export async function loadLectureDetail(lectureId: string, sessionToken?: string | null): Promise<LectureDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const normalizedLectureId = normalizeLectureId(lectureId);
  const response = await request<LectureDetail>(`/api/v1/lectures/${encodeURIComponent(normalizedLectureId)}`, undefined, token);
  const fallback = getLectureDetail(lectureId, userId) ?? getLectureDetail(normalizedLectureId, userId);
  return response?.success && response.data ? response.data : fallback ?? null;
}

export async function loadCourseMaterials(courseId: string, sessionToken?: string | null): Promise<Material[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<Material[]>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/materials`,
    undefined,
    token,
  );
  return response?.success && response.data ? response.data : [];
}

export async function loadCourseNotices(courseId: string, sessionToken?: string | null): Promise<Notice[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const response = await request<Notice[]>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/notices`,
    undefined,
    token,
  );
  return response?.success && response.data ? response.data : [];
}
