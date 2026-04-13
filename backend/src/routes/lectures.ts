import { Hono } from 'hono';
import { completeLectureProgress, getLectureDetail } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';
import { persistLectureProgress } from '../lib/learning-store';
import type { RuntimeBindings } from '../lib/runtime-env';

const lectures = new Hono();

lectures.get('/:lectureId', (c) => {
  const lectureId = c.req.param('lectureId');
  const user = getAuthenticatedUser(c.req.raw);
  const detail = getLectureDetail(lectureId, user?.id);

  if (!detail) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(detail);
});

lectures.post('/:lectureId/complete', async (c) => {
  const lectureId = c.req.param('lectureId');
  const user = getAuthenticatedUser(c.req.raw);

  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const result = completeLectureProgress(user.id, lectureId);

  if (!result.ok) {
    if (result.reason === 'lecture_not_found') {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    return jsonFailure('ENROLLMENT_REQUIRED', '수강 신청 후에 진도를 저장할 수 있습니다.', 409);
  }

  await persistLectureProgress(user.id, lectureId, c.env as RuntimeBindings | undefined);

  return jsonSuccess(
    {
      lecture_id: result.lecture_id,
      course_id: result.course_id,
      progress_percent: result.progress_percent,
      completed_lectures: result.completed_lectures,
      total_lectures: result.total_lectures,
    },
    '강의 진도가 저장되었습니다.',
  );
});

export default lectures;
