import { Hono } from 'hono';
import { getCourseDetail, getCourseMaterials, getCourseNotices, listCourseCards } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';

export function registerCourseQueryRoutes(courses: Hono): void {
  courses.get('/', (c) => {
    const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
    return jsonSuccess(listCourseCards(userId));
  });

  courses.get('/manage', (c) => {
    const user = getAuthenticatedUser(c.req.raw);
    if (!user) {
      return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
    }

    const managedCourses = listCourseCards(user.id).filter((course) => user.role === 'ADMIN' || course.instructor_id === user.id);
    return jsonSuccess(managedCourses, '내 강의 목록을 조회했습니다.');
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

  courses.get('/:courseId/notices', (c) => {
    const userId = getAuthenticatedUser(c.req.raw)?.id ?? 'guest';
    const courseId = c.req.param('courseId');
    const detail = getCourseDetail(courseId, userId);

    if (!detail) {
      return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    return jsonSuccess(getCourseNotices(courseId));
  });
}
