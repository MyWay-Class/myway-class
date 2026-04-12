import {
  createCourseRecord,
  canEnroll,
  completeLectureProgress,
  enrollUser,
  getCourseDetail,
  getDashboard,
  getLectureDetail,
  getRoleLabel,
  type CourseCreateRequest,
  type CourseCard,
  type CourseDetail,
  type LectureDetail,
  type Material,
  type MaterialCreateRequest,
  type Notice,
  type NoticeCreateRequest,
} from '@myway/shared';
import { getFallbackUserId, getStoredAuth, request, unwrap } from './api-core';

type CompleteLectureResponse = {
  lecture_id: string;
  course_id: string;
  progress_percent: number;
  completed_lectures: number;
  total_lectures: number;
};

export async function loadCourses(sessionToken?: string | null): Promise<CourseCard[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<CourseCard[]>(`/api/v1/courses?userId=${encodeURIComponent(userId)}`, undefined, token);
  return unwrap(response, () => getDashboard(userId).courses);
}

export async function createCourse(
  input: CourseCreateRequest,
  sessionToken?: string | null,
): Promise<CourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getStoredAuth()?.user.id ?? getFallbackUserId();

  if (!token) {
    return createCourseRecord(userId, input);
  }

  const response = await request<CourseDetail>(
    '/api/v1/courses',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : createCourseRecord(userId, input);
}

export async function loadCourseDetail(courseId: string, sessionToken?: string | null): Promise<CourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<CourseDetail>(
    `/api/v1/courses/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId)}`,
    undefined,
    token,
  );
  const fallback = getCourseDetail(courseId, userId);
  return response?.success && response.data ? response.data : fallback ?? null;
}

export async function loadLectureDetail(lectureId: string, sessionToken?: string | null): Promise<LectureDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<LectureDetail>(`/api/v1/lectures/${encodeURIComponent(lectureId)}`, undefined, token);
  const fallback = getLectureDetail(lectureId, userId);
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

  if (response?.success && response.data) {
    return response.data;
  }

  const storedAuth = getStoredAuth();
  const userId = storedAuth?.user.id;

  if (!userId) {
    return null;
  }

  const fallback = completeLectureProgress(userId, lectureId);
  if (!fallback.ok) {
    return null;
  }

  return {
    lecture_id: fallback.lecture_id,
    course_id: fallback.course_id,
    progress_percent: fallback.progress_percent,
    completed_lectures: fallback.completed_lectures,
    total_lectures: fallback.total_lectures,
  };
}

export async function enrollCourse(
  courseId: string,
  sessionToken?: string | null,
): Promise<{ enrollmentId: string; course: CourseDetail | null } | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const storedAuth = getStoredAuth();
  const userId = storedAuth?.user.id ?? 'usr_std_001';

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

  if (response?.success && response.data) {
    return response.data;
  }

  const enrollment = enrollUser(userId, courseId);

  return {
    enrollmentId: enrollment.id,
    course: getCourseDetail(courseId, userId) ?? null,
  };
}

export function canCurrentUserEnroll(): boolean {
  const storedAuth = getStoredAuth();
  return storedAuth ? canEnroll(storedAuth.user.role) : false;
}

export function getCurrentRoleLabel(): string {
  const storedAuth = getStoredAuth();
  return storedAuth ? getRoleLabel(storedAuth.user.role) : '게스트';
}
