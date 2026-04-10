import { Hono } from 'hono';
import {
  getCourseDetail,
  getLectureStudioDraft,
  lectureStudioRequiresInstructor,
  listLectureStudioDrafts,
  publishLectureStudioDraft,
  saveLectureStudioDraft,
  updateLectureStudioDraft,
  type LectureStudioDraftInput,
} from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

const lectureDrafts = new Hono();

function canManageCourseContent(userId: string, courseInstructorId: string, role?: string): boolean {
  return role === 'ADMIN' || userId === courseInstructorId;
}

lectureDrafts.get('/course/:courseId', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, user.id);
  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (!lectureStudioRequiresInstructor(user.role) && user.id !== detail.instructor_id) {
    return jsonFailure('FORBIDDEN', '강의 초안을 조회할 권한이 없습니다.', 403);
  }

  return jsonSuccess(listLectureStudioDrafts(courseId));
});

lectureDrafts.post('/course/:courseId', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, user.id);
  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (!canManageCourseContent(user.id, detail.instructor_id, user.role)) {
    return jsonFailure('FORBIDDEN', '강의 초안을 저장할 권한이 없습니다.', 403);
  }

  const body = await readJsonBody<LectureStudioDraftInput>(c.req.raw);
  const lectureId = body?.lecture_id?.trim() || detail.lectures[0]?.id;
  if (!lectureId) {
    return jsonFailure('LECTURE_NOT_FOUND', '초안을 만들 차시가 없습니다.', 404);
  }

  const lecture = detail.lectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return jsonFailure('LECTURE_NOT_FOUND', '차시를 찾을 수 없습니다.', 404);
  }

  const record = saveLectureStudioDraft(detail, lecture, detail.instructor_name, body ?? {});
  return jsonSuccess(record, '강의 초안이 저장되었습니다.', 201);
});

lectureDrafts.put('/course/:courseId/:draftId', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, user.id);
  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (!canManageCourseContent(user.id, detail.instructor_id, user.role)) {
    return jsonFailure('FORBIDDEN', '강의 초안을 수정할 권한이 없습니다.', 403);
  }

  const existing = getLectureStudioDraft(c.req.param('draftId'));
  if (!existing || existing.course_id !== courseId) {
    return jsonFailure('LECTURE_DRAFT_NOT_FOUND', '강의 초안을 찾을 수 없습니다.', 404);
  }

  const body = await readJsonBody<LectureStudioDraftInput>(c.req.raw);
  const lectureId = body?.lecture_id?.trim() || existing.lecture_id;
  const lecture = detail.lectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return jsonFailure('LECTURE_NOT_FOUND', '차시를 찾을 수 없습니다.', 404);
  }

  const record = updateLectureStudioDraft(existing.id, detail, lecture, detail.instructor_name, body ?? {});
  if (!record) {
    return jsonFailure('LECTURE_DRAFT_NOT_FOUND', '강의 초안을 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(record, '강의 초안이 수정되었습니다.');
});

lectureDrafts.post('/course/:courseId/:draftId/publish', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const courseId = c.req.param('courseId');
  const detail = getCourseDetail(courseId, user.id);
  if (!detail) {
    return jsonFailure('COURSE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }

  if (!canManageCourseContent(user.id, detail.instructor_id, user.role)) {
    return jsonFailure('FORBIDDEN', '강의 초안을 발행할 권한이 없습니다.', 403);
  }

  const draft = getLectureStudioDraft(c.req.param('draftId'));
  if (!draft || draft.course_id !== courseId) {
    return jsonFailure('LECTURE_DRAFT_NOT_FOUND', '강의 초안을 찾을 수 없습니다.', 404);
  }

  const published = publishLectureStudioDraft(draft.id);
  if (!published) {
    return jsonFailure('LECTURE_DRAFT_NOT_FOUND', '강의 초안을 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(published, '강의 초안이 발행 준비 상태로 전환되었습니다.');
});

export default lectureDrafts;

