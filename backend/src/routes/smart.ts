import { Hono } from 'hono';
import { getCourseDetail, getLectureDetail, type SmartChatRequest } from '@myway/shared';
import { guardAiRequest } from '../lib/ai-controls';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { createMediaRepository } from '../lib/media-repository';
import { runSmartChat } from '../lib/smart-chat';
import type { RuntimeBindings } from '../lib/runtime-env';

const smart = new Hono();

function ensureLectureExists(lectureId: string): boolean {
  return Boolean(getLectureDetail(lectureId));
}

function canAccessContent(userId: string, role: string, lectureId?: string, courseId?: string): boolean {
  if (role === 'ADMIN' || role === 'INSTRUCTOR') {
    return lectureId ? ensureLectureExists(lectureId) : Boolean(courseId && getCourseDetail(courseId, userId));
  }

  if (lectureId) {
    const lecture = getLectureDetail(lectureId, userId);
    if (!lecture) {
      return false;
    }

    return Boolean(getCourseDetail(lecture.course_id, userId)?.enrolled);
  }

  if (courseId) {
    return Boolean(getCourseDetail(courseId, userId)?.enrolled);
  }

  return false;
}

function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
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

  if (!canAccessContent(userId, user?.role ?? 'STUDENT', lectureId, courseId)) {
    return jsonFailure(user ? 'FORBIDDEN' : 'UNAUTHENTICATED', '수강 중인 강의만 검색할 수 있습니다.', user ? 403 : 401);
  }

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
  }, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));

  return jsonSuccess(result, '스마트 AI 응답을 생성했습니다.');
});

export default smart;
