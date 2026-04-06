import { Hono } from 'hono';
import { getLectureDetail } from '@myway/shared';
import { jsonFailure, jsonSuccess } from '../lib/http';

const lectures = new Hono();

lectures.get('/:lectureId', (c) => {
  const lectureId = c.req.param('lectureId');
  const detail = getLectureDetail(lectureId);

  if (!detail) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(detail);
});

export default lectures;
