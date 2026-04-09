import {
  composeCustomCourse,
  copyCustomCourse,
  listCommunityCustomCourses,
  listMyCustomCourses,
  shareCustomCourse,
  type CustomCourseComposeRequest,
  type CustomCourseCopyRequest,
  type CustomCourseCommunityItem,
  type CustomCourseDetail,
  type CustomCourseLibraryItem,
  type CustomCourseShareRequest,
} from '@myway/shared';
import { getFallbackUserId, getStoredAuth, request } from './api-core';

export async function loadCustomCourseLibrary(sessionToken?: string | null): Promise<CustomCourseLibraryItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return listMyCustomCourses(userId);
  }

  const response = await request<CustomCourseLibraryItem[]>('/api/v1/custom-courses/my', undefined, token);
  return response?.success && response.data ? response.data : listMyCustomCourses(userId);
}

export async function loadCustomCourseCommunity(
  courseId?: string | null,
  sessionToken?: string | null,
): Promise<CustomCourseCommunityItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';

  if (!token) {
    return listCommunityCustomCourses(userId, courseId ?? undefined);
  }

  const response = await request<CustomCourseCommunityItem[]>(`/api/v1/custom-courses/community${query}`, undefined, token);
  return response?.success && response.data ? response.data : listCommunityCustomCourses(userId, courseId ?? undefined);
}

export async function composeCustomCourseDraft(
  input: CustomCourseComposeRequest,
  sessionToken?: string | null,
): Promise<CustomCourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return composeCustomCourse(userId, input);
  }

  const response = await request<CustomCourseDetail>(
    '/api/v1/custom-courses/compose',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : composeCustomCourse(userId, input);
}

export async function copyCustomCourseDraft(
  customCourseId: string,
  input: CustomCourseCopyRequest,
  sessionToken?: string | null,
): Promise<CustomCourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return copyCustomCourse(userId, { ...input, custom_course_id: customCourseId });
  }

  const response = await request<CustomCourseDetail>(
    `/api/v1/custom-courses/${encodeURIComponent(customCourseId)}/copy`,
    {
      method: 'POST',
      body: JSON.stringify({ ...input, custom_course_id: customCourseId }),
    },
    token,
  );

  return response?.success && response.data ? response.data : copyCustomCourse(userId, { ...input, custom_course_id: customCourseId });
}

export async function shareCustomCourseDraft(
  customCourseId: string,
  input: CustomCourseShareRequest,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();

  if (!token) {
    return Boolean(shareCustomCourse(userId, customCourseId, input));
  }

  const response = await request(
    `/api/v1/custom-courses/${encodeURIComponent(customCourseId)}/share`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success) || Boolean(shareCustomCourse(userId, customCourseId, input));
}
