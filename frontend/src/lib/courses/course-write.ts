import { type CourseCreateRequest, type CourseDetail, type Material, type MaterialCreateRequest, type Notice, type NoticeCreateRequest } from '@myway/shared';
import { getStoredAuth, request } from '../api-core';

type CompleteLectureResponse = {
  lecture_id: string;
  course_id: string;
  progress_percent: number;
  completed_lectures: number;
  total_lectures: number;
};

export async function createCourse(
  input: CourseCreateRequest,
  sessionToken?: string | null,
): Promise<CourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;

  const response = await request<CourseDetail>(
    '/api/v1/courses',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function createCourseMaterial(
  courseId: string,
  input: MaterialCreateRequest,
  sessionToken?: string | null,
): Promise<Material | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<Material>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/materials`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function createCourseNotice(
  courseId: string,
  input: NoticeCreateRequest,
  sessionToken?: string | null,
): Promise<Notice | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<Notice>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/notices`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function completeLecture(
  lectureId: string,
  sessionToken?: string | null,
): Promise<CompleteLectureResponse | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<CompleteLectureResponse>(
    `/api/v1/lectures/${encodeURIComponent(lectureId)}/complete`,
    { method: 'POST' },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function enrollCourse(
  courseId: string,
  sessionToken?: string | null,
): Promise<{ enrollmentId: string; course: CourseDetail | null } | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<{ enrollmentId: string; course: CourseDetail | null }>(
    '/api/v1/enrollments',
    {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}
