import { Hono } from 'hono';
import { demoCourses, demoEnrollments, enrollUser, getCourseDetail } from '@myway/shared';
import { getAuthenticatedUser, hasRole } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { persistEnrollment } from '../lib/learning-store';
import type { RuntimeBindings } from '../lib/runtime-env';

type EnrollmentRequest = {
  userId?: string;
  courseId?: string;
};

const enrollments = new Hono();

enrollments.get('/', (c) => {
  const user = getAuthenticatedUser(c.req.raw);

  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const userId = user.id;

  const items = demoEnrollments
    .filter((enrollment) => enrollment.user_id === userId)
    .map((enrollment) => ({
      ...enrollment,
      course: getCourseDetail(enrollment.course_id, userId),
      title: demoCourses.find((course) => course.id === enrollment.course_id)?.title ?? '알 수 없는 강의',
    }));

  return jsonSuccess(items);
});

enrollments.post('/', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  if (!hasRole(user, ['STUDENT', 'ADMIN'])) {
    return jsonFailure('FORBIDDEN', '현재 역할은 수강 신청을 할 수 없습니다.', 403);
  }

  const body = await readJsonBody<EnrollmentRequest>(c.req.raw);
  const courseId = body?.courseId?.trim();

  if (!courseId) {
    return jsonFailure('COURSE_ID_REQUIRED', '강의 식별자가 필요합니다.');
  }

  const course = demoCourses.find((item) => item.id === courseId);
  if (!course) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const enrollment = enrollUser(user.id, courseId);
  const courseDetail = getCourseDetail(courseId, user.id);
  await persistEnrollment(enrollment, c.env as RuntimeBindings | undefined);

  return jsonSuccess(
    {
      enrollmentId: enrollment.id,
      course: courseDetail,
    },
    '수강 신청이 완료되었습니다.',
  );
});

export default enrollments;
