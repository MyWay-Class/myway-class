import { Hono } from 'hono';
import { getCourseDetail, listCourseCards } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';

const courses = new Hono();

courses.get('/', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  return jsonSuccess(listCourseCards(userId));
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

courses.get('/:courseId', (c) => {
  const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, userId);

  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(detail);
});

export default courses;
