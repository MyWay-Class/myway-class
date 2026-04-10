import { Hono } from 'hono';
import { getCourseDetail, getLectureDetail, type SmartChatRequest } from '@myway/shared';
import { guardAiRequest } from '../lib/ai-controls';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { runSmartChat } from '../lib/smart-chat';
import type { RuntimeBindings } from '../lib/runtime-env';

const smart = new Hono();

function ensureLectureExists(lectureId: string): boolean {
  return Boolean(getLectureDetail(lectureId));
}

smart.post('/chat', async (c) => {
  const access = await guardAiRequest(c.req.raw, c.env as RuntimeBindings | undefined, 'smart');
  if (access instanceof Response) {
    return access;
  }
  const user = access.user;
  const userId = user?.id ?? 'guest';

  const body = await readJsonBody<SmartChatRequest>(c.req.raw);
  const message = body?.message?.trim();
  if (!message) {
    return jsonFailure('MESSAGE_REQUIRED', 'message가 필요합니다.');
  }

  const lectureId = body?.lecture_id?.trim();
  const courseId = body?.course_id?.trim();

  if (lectureId && !ensureLectureExists(lectureId)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (courseId && !getCourseDetail(courseId, userId)) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  const result = await runSmartChat({
    message,
    lecture_id: lectureId,
    course_id: courseId,
    context: body?.context,
    language: body?.language ?? 'ko',
  });

  return jsonSuccess(result, '스마트 AI 응답을 생성했습니다.');
});

export default smart;
