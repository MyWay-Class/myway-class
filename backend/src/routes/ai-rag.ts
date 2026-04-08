import { Hono } from 'hono';
import { getCourseLectures, getLectureDetail, type AIRagRequest, buildAIRAGOverview } from '@myway/shared';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

const rag = new Hono();

function ensureCourseExists(courseId: string): boolean {
  return getCourseLectures(courseId).length > 0;
}

rag.post('/', async (c) => {
  const body = await readJsonBody<AIRagRequest>(c.req.raw);
  const query = body?.query?.trim();

  if (!query) {
    return jsonFailure('QUERY_REQUIRED', 'query가 필요합니다.');
  }

  const lectureId = body?.lecture_id?.trim();
  if (lectureId && !getLectureDetail(lectureId)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const courseId = body?.course_id?.trim();
  if (courseId && !ensureCourseExists(courseId)) {
    return jsonFailure('COURSE_NOT_FOUND', '과목을 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(
    buildAIRAGOverview({
      query,
      lecture_id: lectureId,
      course_id: courseId,
      limit: body?.limit,
      context: body?.context,
      preferred_provider: body?.preferred_provider,
    }),
    'RAG 파이프라인이 생성되었습니다.',
  );
});

export default rag;
