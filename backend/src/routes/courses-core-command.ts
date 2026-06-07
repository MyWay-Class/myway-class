import { Hono } from 'hono';
import {
  canManageCourses,
  createCourseRecord,
  createCourseMaterial,
  createCourseNotice,
  getCourseDetail,
  type CourseCreateRequest,
} from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { persistCourseDetail } from '../lib/learning-store';
import type { RuntimeBindings } from '../lib/runtime-env';

type MaterialInput = {
  title?: string;
  summary?: string;
  file_name?: string;
};

type NoticeInput = {
  title?: string;
  content?: string;
  pinned?: boolean;
};

function canManageCourseContent(userId: string, courseInstructorId: string, role?: string): boolean {
  return role === 'ADMIN' || userId === courseInstructorId;
}

function normalizeLectureTitles(input?: CourseCreateRequest['lecture_titles']): string[] {
  return (input ?? []).map((item) => item.trim()).filter(Boolean);
}

export function registerCourseCommandRoutes(courses: Hono): void {
  courses.post('/', async (c) => {
    const user = getAuthenticatedUser(c.req.raw);
    if (!user) {
      return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
    }

    if (!canManageCourses(user.role)) {
      return jsonFailure('FORBIDDEN', '강의를 개설할 권한이 없습니다.', 403);
    }

    const body = await readJsonBody<CourseCreateRequest>(c.req.raw);
    const title = body?.title?.trim();
    const description = body?.description?.trim();
    const category = body?.category?.trim();
    const difficulty = body?.difficulty?.trim();

    if (!title || !description || !category || !difficulty) {
      return jsonFailure('COURSE_CREATE_FIELDS_REQUIRED', '강의 제목, 설명, 카테고리, 난이도가 필요합니다.');
    }

    const lectureTitles = normalizeLectureTitles(body?.lecture_titles);
    const result = createCourseRecord(user.id, {
      title,
      description,
      category,
      difficulty: difficulty as CourseCreateRequest['difficulty'],
      tags: body?.tags?.map((item) => item.trim()).filter(Boolean),
      is_published: body?.is_published ?? true,
      lecture_titles: lectureTitles.length > 0 ? lectureTitles : [title],
    });

    try {
      await persistCourseDetail(result, c.env as RuntimeBindings | undefined);
    } catch (error) {
      console.error('failed to persist created course detail', error);
    }

    return jsonSuccess(result, '새 강의가 개설되었습니다.', 201);
  });

  courses.post('/:courseId/materials', async (c) => {
    const user = getAuthenticatedUser(c.req.raw);
    if (!user) {
      return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
    }

    const courseId = c.req.param('courseId');
    const detail = getCourseDetail(courseId, user.id);
    if (!detail) {
      return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    if (!canManageCourseContent(user.id, detail.instructor_id, user.role)) {
      return jsonFailure('FORBIDDEN', '자료를 등록할 권한이 없습니다.', 403);
    }

    const body = await readJsonBody<MaterialInput>(c.req.raw);
    const title = body?.title?.trim();
    const summary = body?.summary?.trim();
    const fileName = body?.file_name?.trim();

    if (!title || !summary || !fileName) {
      return jsonFailure('MATERIAL_FIELDS_REQUIRED', '자료 제목, 요약, 파일명이 필요합니다.');
    }

    const material = createCourseMaterial(user.id, courseId, {
      title,
      summary,
      file_name: fileName,
    });

    const updatedDetail = getCourseDetail(courseId, user.id);
    if (updatedDetail) {
      try {
        await persistCourseDetail(updatedDetail, c.env as RuntimeBindings | undefined);
      } catch (error) {
        console.error('failed to persist course material', error);
      }
    }

    return jsonSuccess(material, '자료가 등록되었습니다.', 201);
  });

  courses.post('/:courseId/notices', async (c) => {
    const user = getAuthenticatedUser(c.req.raw);
    if (!user) {
      return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
    }

    const courseId = c.req.param('courseId');
    const detail = getCourseDetail(courseId, user.id);
    if (!detail) {
      return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    if (!canManageCourseContent(user.id, detail.instructor_id, user.role)) {
      return jsonFailure('FORBIDDEN', '공지를 등록할 권한이 없습니다.', 403);
    }

    const body = await readJsonBody<NoticeInput>(c.req.raw);
    const title = body?.title?.trim();
    const content = body?.content?.trim();

    if (!title || !content) {
      return jsonFailure('NOTICE_FIELDS_REQUIRED', '공지 제목과 내용이 필요합니다.');
    }

    const notice = createCourseNotice(user.id, courseId, {
      title,
      content,
      pinned: Boolean(body?.pinned),
    });

    const updatedDetail = getCourseDetail(courseId, user.id);
    if (updatedDetail) {
      try {
        await persistCourseDetail(updatedDetail, c.env as RuntimeBindings | undefined);
      } catch (error) {
        console.error('failed to persist course notice', error);
      }
    }

    return jsonSuccess(notice, '공지가 등록되었습니다.', 201);
  });
}
