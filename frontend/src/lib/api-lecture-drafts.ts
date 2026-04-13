import {
  getLectureStudioDraft as getLectureStudioDraftFallback,
  listLectureStudioDrafts as listLectureStudioDraftsFallback,
  publishLectureStudioDraft as publishLectureStudioDraftFallback,
  saveLectureStudioDraft as saveLectureStudioDraftFallback,
  updateLectureStudioDraft as updateLectureStudioDraftFallback,
  type CourseDetail,
  type Lecture,
  type LectureDetail,
  type LectureStudioDraftInput,
  type LectureStudioDraftRecord,
  type LectureStudioDraftSummary,
} from '@myway/shared';
import { getStoredAuth, request } from './api-core';

function resolveToken(sessionToken?: string | null): string | null {
  return sessionToken ?? getStoredAuth()?.session_token ?? null;
}

function resolveCourseLecture(course: CourseDetail | null, lecture: LectureDetail | Lecture | null): {
  course: CourseDetail | null;
  lecture: LectureDetail | Lecture | null;
} {
  return { course, lecture };
}

export async function loadLectureStudioDrafts(courseId?: string | null, sessionToken?: string | null): Promise<LectureStudioDraftSummary[]> {
  const token = resolveToken(sessionToken);

  if (!token) {
    return listLectureStudioDraftsFallback(courseId ?? undefined);
  }

  if (!courseId) {
    return listLectureStudioDraftsFallback(undefined);
  }

  const response = await request<LectureStudioDraftSummary[]>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseId)}`,
    undefined,
    token,
  );
  return response?.success && response.data ? response.data : listLectureStudioDraftsFallback(courseId);
}

export async function loadLectureStudioDraft(
  courseId: string,
  draftId: string,
  sessionToken?: string | null,
): Promise<LectureStudioDraftRecord | null> {
  const token = resolveToken(sessionToken);

  if (!token) {
    return getLectureStudioDraftFallback(draftId) ?? null;
  }

  const response = await request<LectureStudioDraftRecord>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseId)}/${encodeURIComponent(draftId)}`,
    undefined,
    token,
  );

  return response?.success && response.data ? response.data : getLectureStudioDraftFallback(draftId) ?? null;
}

export async function saveLectureStudioDraft(
  course: CourseDetail | null,
  lecture: LectureDetail | Lecture | null,
  input: LectureStudioDraftInput,
  sessionToken?: string | null,
): Promise<LectureStudioDraftRecord | null> {
  const token = resolveToken(sessionToken);
  const { course: courseData, lecture: lectureData } = resolveCourseLecture(course, lecture);

  if (!courseData || !lectureData) {
    return null;
  }

  if (!token) {
    return saveLectureStudioDraftFallback(courseData, lectureData, courseData.instructor_name, input);
  }

  const response = await request<LectureStudioDraftRecord>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseData.id)}`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : saveLectureStudioDraftFallback(courseData, lectureData, courseData.instructor_name, input);
}

export async function updateLectureStudioDraft(
  course: CourseDetail | null,
  draftId: string,
  lecture: LectureDetail | Lecture | null,
  input: LectureStudioDraftInput,
  sessionToken?: string | null,
): Promise<LectureStudioDraftRecord | null> {
  const token = resolveToken(sessionToken);
  const { course: courseData, lecture: lectureData } = resolveCourseLecture(course, lecture);

  if (!courseData || !lectureData) {
    return null;
  }

  if (!token) {
    return updateLectureStudioDraftFallback(draftId, courseData, lectureData, courseData.instructor_name, input);
  }

  const response = await request<LectureStudioDraftRecord>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseData.id)}/${encodeURIComponent(draftId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data
    ? response.data
    : updateLectureStudioDraftFallback(draftId, courseData, lectureData, courseData.instructor_name, input);
}

export async function publishLectureStudioDraft(
  courseId: string,
  draftId: string,
  sessionToken?: string | null,
): Promise<LectureStudioDraftRecord | null> {
  const token = resolveToken(sessionToken);

  if (!token) {
    return publishLectureStudioDraftFallback(draftId);
  }

  const response = await request<LectureStudioDraftRecord>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseId)}/${encodeURIComponent(draftId)}/publish`,
    {
      method: 'POST',
    },
    token,
  );

  return response?.success && response.data ? response.data : publishLectureStudioDraftFallback(draftId);
}
