import { Hono } from 'hono';
import {
  composeCustomCourse,
  copyCustomCourse,
  getCustomCourseById,
  listCommunityCustomCourses,
  listMyCustomCourses,
  shareCustomCourse,
  type CustomCourseComposeRequest,
  type CustomCourseCopyRequest,
  type CustomCourseShareRequest,
} from '@myway/shared';
import { getAuthenticatedUser, hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

const customCourses = new Hono();

customCourses.post('/compose', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<CustomCourseComposeRequest>(c.req.raw);
  const courseId = body?.course_id?.trim();
  const title = body?.title?.trim();

  if (!courseId || !title) {
    return jsonFailure('CUSTOM_COURSE_FIELDS_REQUIRED', 'course_id와 title이 필요합니다.');
  }

  const clips = body?.clips ?? [];
  if (clips.length === 0) {
    return jsonFailure('CUSTOM_COURSE_CLIPS_REQUIRED', '최소 1개 이상의 클립이 필요합니다.');
  }

  const result = composeCustomCourse(user.id, {
    course_id: courseId,
    title,
    description: body?.description?.trim(),
    clips,
  });

  if (!result) {
    return jsonFailure('CUSTOM_COURSE_COMPOSE_FAILED', '커스텀 강의를 조립할 수 없습니다.', 400);
  }

  return jsonSuccess(result, '커스텀 강의가 생성되었습니다.', 201);
});

customCourses.get('/my', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(listMyCustomCourses(user.id));
});

customCourses.get('/community', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const courseId = c.req.query('course_id')?.trim();
  return jsonSuccess(listCommunityCustomCourses(user.id, courseId || undefined));
});

customCourses.get('/:customCourseId', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const detail = getCustomCourseById(c.req.param('customCourseId'));
  if (!detail) {
    return jsonFailure('CUSTOM_COURSE_NOT_FOUND', '커스텀 강의를 찾을 수 없습니다.', 404);
  }

  if (detail.owner_id !== user.id && !hasRole(user, ['ADMIN'])) {
    const shared = detail.shares.some((share) => share.course_id === detail.course_id);
    if (!shared) {
      return jsonFailure('FORBIDDEN', '커스텀 강의를 볼 수 없습니다.', 403);
    }
  }

  return jsonSuccess(detail);
});

customCourses.post('/:customCourseId/share', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<CustomCourseShareRequest>(c.req.raw);
  const result = shareCustomCourse(user.id, c.req.param('customCourseId'), {
    message: body?.message,
  });

  if (!result) {
    return jsonFailure('CUSTOM_COURSE_SHARE_FAILED', '커스텀 강의를 공유할 수 없습니다.', 400);
  }

  return jsonSuccess(result, '커스텀 강의가 공유되었습니다.', 201);
});

customCourses.post('/:customCourseId/copy', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<CustomCourseCopyRequest>(c.req.raw);
  const result = copyCustomCourse(user.id, {
    custom_course_id: body?.custom_course_id?.trim() || c.req.param('customCourseId'),
    title: body?.title,
    description: body?.description,
  });

  if (!result) {
    return jsonFailure('CUSTOM_COURSE_COPY_FAILED', '커스텀 강의를 담아갈 수 없습니다.', 400);
  }

  return jsonSuccess(result, '커스텀 강의를 담아갔습니다.', 201);
});

export default customCourses;
