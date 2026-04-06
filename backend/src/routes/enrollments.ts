import { Hono } from 'hono';
import { demoCourses, demoEnrollments, enrollUser, getCourseDetail } from '@myway/shared';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

type EnrollmentRequest = {
  userId?: string;
  courseId?: string;
};

const enrollments = new Hono();

enrollments.get('/', (c) => {
  const userId = c.req.query('userId') ?? 'usr_std_001';

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
  const body = await readJsonBody<EnrollmentRequest>(c.req.raw);
  const userId = body?.userId?.trim() || 'usr_std_001';
  const courseId = body?.courseId?.trim();

  if (!courseId) {
    return jsonFailure('COURSE_ID_REQUIRED', '강의 식별자가 필요합니다.');
  }

  const course = demoCourses.find((item) => item.id === courseId);
  if (!course) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const enrollment = enrollUser(userId, courseId);
  const courseDetail = getCourseDetail(courseId, userId);

  return jsonSuccess(
    {
      enrollmentId: enrollment.id,
      course: courseDetail,
    },
    '수강 신청이 완료되었습니다.',
  );
});

export default enrollments;
