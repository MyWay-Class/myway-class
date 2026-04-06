import {
  enrollUser,
  getCourseDetail,
  getDashboard,
  getLectureDetail,
  type ApiResponse,
  type CourseCard,
  type CourseDetail,
  type Dashboard,
  type LectureDetail,
} from '@myway/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const DEFAULT_USER_ID = 'usr_std_001';

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T> | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function unwrap<T>(response: ApiResponse<T> | null, fallback: () => T): T {
  if (response?.success && response.data !== undefined) {
    return response.data;
  }

  return fallback();
}

export async function loadDashboard(userId: string = DEFAULT_USER_ID): Promise<Dashboard> {
  const response = await request<Dashboard>(`/api/v1/dashboard?userId=${encodeURIComponent(userId)}`);
  return unwrap(response, () => getDashboard(userId));
}

export async function loadCourses(userId: string = DEFAULT_USER_ID): Promise<CourseCard[]> {
  const response = await request<CourseCard[]>(`/api/v1/courses?userId=${encodeURIComponent(userId)}`);
  return unwrap(response, () => getDashboard(userId).courses);
}

export async function loadCourseDetail(courseId: string, userId: string = DEFAULT_USER_ID): Promise<CourseDetail | null> {
  const response = await request<CourseDetail>(
    `/api/v1/courses/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId)}`,
  );
  const fallback = getCourseDetail(courseId, userId);
  return response?.success && response.data ? response.data : fallback ?? null;
}

export async function loadLectureDetail(lectureId: string): Promise<LectureDetail | null> {
  const response = await request<LectureDetail>(`/api/v1/lectures/${encodeURIComponent(lectureId)}`);
  const fallback = getLectureDetail(lectureId);
  return response?.success && response.data ? response.data : fallback ?? null;
}

export async function enrollCourse(
  userId: string,
  courseId: string,
): Promise<{ enrollmentId: string; course: CourseDetail | null }> {
  const response = await request<{ enrollmentId: string; course: CourseDetail | null }>('/api/v1/enrollments', {
    method: 'POST',
    body: JSON.stringify({ userId, courseId }),
  });

  if (response?.success && response.data) {
    return response.data;
  }

  const enrollment = enrollUser(userId, courseId);

  return {
    enrollmentId: enrollment.id,
    course: getCourseDetail(courseId, userId) ?? null,
  };
}
