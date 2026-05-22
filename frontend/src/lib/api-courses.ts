import {
  createCourseRecord,
  canEnroll,
  canManageCourses,
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
  type Lecture,
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

type LectureVideoMappingResult = {
  lecture_id: string;
  asset_key?: string;
  video_url?: string;
};

type EnrollmentItem = {
  id: string;
  user_id: string;
  course_id: string;
};

function normalizeLectureVideoFields(lecture: Lecture, fallbackLecture?: Lecture): Lecture {
  return {
    ...fallbackLecture,
    ...lecture,
    video_url: lecture.video_url ?? fallbackLecture?.video_url,
    video_asset_key: lecture.video_asset_key ?? fallbackLecture?.video_asset_key,
  };
}

function mergeCourseDetailWithFallback(primary: CourseDetail, fallback: CourseDetail | null | undefined): CourseDetail {
  if (!fallback) {
    return primary;
  }

  const fallbackLectureMap = new Map(fallback.lectures.map((lecture) => [lecture.id, lecture]));
  const mergedLectures = primary.lectures.map((lecture) => normalizeLectureVideoFields(lecture, fallbackLectureMap.get(lecture.id)));

  return {
    ...fallback,
    ...primary,
    lectures: mergedLectures,
    materials: Array.isArray(primary.materials) ? primary.materials : fallback.materials,
    notices: Array.isArray(primary.notices) ? primary.notices : fallback.notices,
  };
}

async function hydrateMissingLectureVideos(detail: CourseDetail, token: string | null): Promise<CourseDetail> {
  const missingLectureIds = detail.lectures
    .filter((lecture) => !lecture.video_url && !lecture.video_asset_key)
    .map((lecture) => lecture.id);

  if (missingLectureIds.length === 0 || !token) {
    return detail;
  }

  const mappingPairs = await Promise.all(
    missingLectureIds.map(async (lectureId) => {
      const response = await request<LectureVideoMappingResult>(
        `/api/v1/media/lecture-video/${encodeURIComponent(lectureId)}`,
        undefined,
        token,
      );
      if (!response?.success || !response.data) {
        return null;
      }
      return [lectureId, response.data] as const;
    }),
  );

  const mappingMap = new Map(mappingPairs.filter(Boolean) as ReadonlyArray<readonly [string, LectureVideoMappingResult]>);
  if (mappingMap.size === 0) {
    return detail;
  }

  return {
    ...detail,
    lectures: detail.lectures.map((lecture) => {
      const mapping = mappingMap.get(lecture.id);
      if (!mapping) {
        return lecture;
      }
      return {
        ...lecture,
        video_url: lecture.video_url ?? mapping.video_url,
        video_asset_key: lecture.video_asset_key ?? mapping.asset_key,
      };
    }),
  };
}

export async function loadCourses(sessionToken?: string | null): Promise<CourseCard[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<CourseCard[]>(`/api/v1/courses?userId=${encodeURIComponent(userId)}`, undefined, token);
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
  const storedAuth = getStoredAuth();

  if (!storedAuth) {
    return [];
  }

  if (!canManageCourses(storedAuth.user.role)) {
    return [];
  }

  const response = await request<CourseCard[]>('/api/v1/courses/manage', undefined, token);
  if (response?.success && response.data) {
    return response.data;
  }

  const fallbackCourses = await loadCourses(token);
  return fallbackCourses.filter((course) => storedAuth.user.role === 'ADMIN' || course.instructor_id === storedAuth.user.id);
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
  if (response?.success && response.data) {
    const merged = mergeCourseDetailWithFallback(response.data, fallback);
    return await hydrateMissingLectureVideos(merged, token);
  }
  return fallback ?? null;
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
