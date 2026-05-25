import {
  type CustomCourseComposeRequest,
  type CustomCourseCopyRequest,
  type CustomCourseCommunityItem,
  type CustomCourseDetail,
  type CustomCourseLibraryItem,
  type CustomCourseShareRequest,
} from '@myway/shared';
import { getStoredAuth, request } from './api-core';

export async function loadCustomCourseLibrary(sessionToken?: string | null): Promise<CustomCourseLibraryItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return [];

  const response = await request<CustomCourseLibraryItem[]>('/api/v1/custom-courses/my', undefined, token);
  return response?.success && response.data ? response.data : [];
}

export async function loadCustomCourseCommunity(
  courseId?: string | null,
  sessionToken?: string | null,
): Promise<CustomCourseCommunityItem[]> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
  if (!token) return [];

  const response = await request<CustomCourseCommunityItem[]>(`/api/v1/custom-courses/community${query}`, undefined, token);
  return response?.success && response.data ? response.data : [];
}

export async function composeCustomCourseDraft(
  input: CustomCourseComposeRequest,
  sessionToken?: string | null,
): Promise<CustomCourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;

  const response = await request<CustomCourseDetail>(
    '/api/v1/custom-courses/compose',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function copyCustomCourseDraft(
  customCourseId: string,
  input: CustomCourseCopyRequest,
  sessionToken?: string | null,
): Promise<CustomCourseDetail | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return null;

  const response = await request<CustomCourseDetail>(
    `/api/v1/custom-courses/${encodeURIComponent(customCourseId)}/copy`,
    {
      method: 'POST',
      body: JSON.stringify({ ...input, custom_course_id: customCourseId }),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function shareCustomCourseDraft(
  customCourseId: string,
  input: CustomCourseShareRequest,
  sessionToken?: string | null,
): Promise<boolean> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;
  if (!token) return false;

  const response = await request(
    `/api/v1/custom-courses/${encodeURIComponent(customCourseId)}/share`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return Boolean(response?.success);
}
