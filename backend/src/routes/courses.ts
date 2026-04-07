import { Hono } from 'hono';
import {
  createCourseMaterial,
  createCourseNotice,
  getCourseDetail,
  getCourseMaterials,
  getCourseNotices,
  listCourseCards,
} from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

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

const courses = new Hono();

function canManageCourseContent(userId: string, courseInstructorId: string, role?: string): boolean {
  return role === 'ADMIN' || userId === courseInstructorId;
}

courses.get('/', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  return jsonSuccess(listCourseCards(userId));
});

courses.get('/:courseId', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, userId);

  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(detail);
});

courses.get('/:courseId/lectures', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, userId);

  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(detail.lectures);
});

courses.get('/:courseId/materials', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, userId);

  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(getCourseMaterials(courseId));
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

  return jsonSuccess(material, '자료가 등록되었습니다.', 201);
});

courses.get('/:courseId/notices', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, userId);

  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(getCourseNotices(courseId));
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

  return jsonSuccess(notice, '공지가 등록되었습니다.', 201);
});

export default courses;
