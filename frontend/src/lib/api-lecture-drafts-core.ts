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
import { z } from 'zod';
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

const lectureStudioDraftSummarySchema = z.object({
  id: z.string(),
  course_id: z.string(),
  lecture_id: z.string(),
  lecture_title: z.string().optional(),
}).passthrough();

const lectureStudioDraftRecordSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  lecture_id: z.string(),
  lecture_title: z.string().optional(),
  title: z.string().optional(),
}).passthrough();

function parseDraftSummaries(data: unknown): LectureStudioDraftSummary[] | null {
  const parsed = z.array(lectureStudioDraftSummarySchema).safeParse(data);
  return parsed.success ? (parsed.data as LectureStudioDraftSummary[]) : null;
}

function parseDraftRecord(data: unknown): LectureStudioDraftRecord | null {
  const parsed = lectureStudioDraftRecordSchema.safeParse(data);
  return parsed.success ? (parsed.data as LectureStudioDraftRecord) : null;
}

export async function loadLectureStudioDrafts(courseId?: string | null, sessionToken?: string | null): Promise<LectureStudioDraftSummary[]> {
  const token = resolveToken(sessionToken);

  if (!token) {
    return listLectureStudioDraftsFallback(courseId ?? undefined);
  }

  if (!courseId) {
    return listLectureStudioDraftsFallback(undefined);
  }

  const response = await request<unknown>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseId)}`,
    undefined,
    token,
  );
  const parsed = response?.success ? parseDraftSummaries(response.data) : null;
  return parsed ?? listLectureStudioDraftsFallback(courseId);
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

  const response = await request<unknown>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseId)}/${encodeURIComponent(draftId)}`,
    undefined,
    token,
  );
  const parsed = response?.success ? parseDraftRecord(response.data) : null;
  return parsed ?? getLectureStudioDraftFallback(draftId) ?? null;
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

  const response = await request<unknown>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseData.id)}`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
  const parsed = response?.success ? parseDraftRecord(response.data) : null;
  return parsed ?? saveLectureStudioDraftFallback(courseData, lectureData, courseData.instructor_name, input);
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

  const response = await request<unknown>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseData.id)}/${encodeURIComponent(draftId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );
  const parsed = response?.success ? parseDraftRecord(response.data) : null;
  return parsed ?? updateLectureStudioDraftFallback(draftId, courseData, lectureData, courseData.instructor_name, input);
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

  const response = await request<unknown>(
    `/api/v1/lecture-drafts/course/${encodeURIComponent(courseId)}/${encodeURIComponent(draftId)}/publish`,
    {
      method: 'POST',
    },
    token,
  );
  const parsed = response?.success ? parseDraftRecord(response.data) : null;
  return parsed ?? publishLectureStudioDraftFallback(draftId);
}
