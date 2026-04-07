import { Hono } from 'hono';
import {
  composeShortformVideo,
  generateShortformExtraction,
  getShortformExtractionById,
  getShortformVideoDetail,
  listMyShortformLibrary,
  listMyShortformVideos,
  listShortformCommunity,
  saveShortformVideo,
  shareShortformVideo,
  toggleShortformCandidateSelection,
  toggleShortformLike,
  type ShortformComposeRequest,
  type ShortformGenerateRequest,
  type ShortformLikeRequest,
  type ShortformSaveRequest,
  type ShortformSelectRequest,
  type ShortformShareRequest,
} from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

const shortform = new Hono();

shortform.post('/generate', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<ShortformGenerateRequest>(c.req.raw);
  const courseId = body?.course_id?.trim();
  if (!courseId) {
    return jsonFailure('COURSE_ID_REQUIRED', 'course_id가 필요합니다.');
  }

  return jsonSuccess(
    generateShortformExtraction(user.id, {
      lecture_id: body?.lecture_id?.trim(),
      course_id: courseId,
      mode: body?.mode ?? 'cross',
      style: body?.style ?? 'highlight',
      target_duration_sec: body?.target_duration_sec ?? 300,
      language: body?.language ?? 'ko',
    }),
    '숏폼 후보가 생성되었습니다.',
    201,
  );
});

shortform.put('/candidates/select', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<ShortformSelectRequest>(c.req.raw);
  if (!body?.candidate_ids?.length) {
    return jsonFailure('CANDIDATE_IDS_REQUIRED', 'candidate_ids가 필요합니다.');
  }

  return jsonSuccess(toggleShortformCandidateSelection(body), '후보 선택이 반영되었습니다.');
});

shortform.get('/extraction/:id', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const extraction = getShortformExtractionById(c.req.param('id'));
  if (!extraction) {
    return jsonFailure('EXTRACTION_NOT_FOUND', '추출 결과를 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(extraction);
});

shortform.post('/compose', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<ShortformComposeRequest>(c.req.raw);
  const extractionId = body?.extraction_id?.trim();
  const title = body?.title?.trim();

  if (!extractionId || !title) {
    return jsonFailure('SHORTFORM_FIELDS_REQUIRED', 'extraction_id와 title이 필요합니다.');
  }

  const video = composeShortformVideo(user.id, {
    extraction_id: extractionId,
    title,
    candidate_ids: body?.candidate_ids,
    description: body?.description?.trim(),
  });

  if (!video) {
    return jsonFailure('SHORTFORM_COMPOSE_FAILED', '숏폼을 생성할 수 없습니다.', 400);
  }

  return jsonSuccess(video, '숏폼이 생성되었습니다.', 201);
});

shortform.get('/videos/my', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(listMyShortformVideos(user.id));
});

shortform.get('/video/:id', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const video = getShortformVideoDetail(c.req.param('id'));
  if (!video) {
    return jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404);
  }

  return jsonSuccess(video);
});

shortform.post('/share', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<ShortformShareRequest>(c.req.raw);
  const videoId = body?.video_id?.trim();
  const courseId = body?.course_id?.trim();

  if (!videoId || !courseId) {
    return jsonFailure('SHORTFORM_SHARE_FIELDS_REQUIRED', 'video_id와 course_id가 필요합니다.');
  }

  const result = shareShortformVideo(user.id, {
    video_id: videoId,
    course_id: courseId,
    visibility: body?.visibility ?? 'course',
    message: body?.message,
  });

  if (!result) {
    return jsonFailure('SHORTFORM_SHARE_FAILED', '숏폼을 공유할 수 없습니다.', 400);
  }

  return jsonSuccess(result, '숏폼이 공유되었습니다.', 201);
});

shortform.get('/community', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const courseId = c.req.query('course_id')?.trim();
  return jsonSuccess(listShortformCommunity(user.id, courseId || undefined));
});

shortform.post('/save', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<ShortformSaveRequest>(c.req.raw);
  const videoId = body?.video_id?.trim();
  if (!videoId) {
    return jsonFailure('VIDEO_ID_REQUIRED', 'video_id가 필요합니다.');
  }

  const result = saveShortformVideo(user.id, {
    video_id: videoId,
    note: body?.note,
    folder: body?.folder,
  });

  if (!result) {
    return jsonFailure('SHORTFORM_SAVE_FAILED', '숏폼을 담아갈 수 없습니다.', 400);
  }

  return jsonSuccess(result, '숏폼이 담아가기 되었습니다.', 201);
});

shortform.post('/like', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<ShortformLikeRequest>(c.req.raw);
  const videoId = body?.video_id?.trim();
  if (!videoId) {
    return jsonFailure('VIDEO_ID_REQUIRED', 'video_id가 필요합니다.');
  }

  const result = toggleShortformLike(user.id, { video_id: videoId });
  if (!result) {
    return jsonFailure('SHORTFORM_LIKE_FAILED', '좋아요를 처리할 수 없습니다.', 400);
  }

  return jsonSuccess(result, '좋아요 상태가 반영되었습니다.');
});

shortform.get('/library', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(listMyShortformLibrary(user.id));
});

export default shortform;
