import { Hono } from 'hono';
import {
  getShortformVideoDetail,
  listMyShortformLibrary,
  listMyShortformVideos,
  listShortformCommunity,
  saveShortformVideo,
  shareShortformVideo,
  toggleShortformLike,
  type ShortformLikeRequest,
  type ShortformSaveRequest,
  type ShortformShareRequest,
} from '@myway/shared';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { requireAuth } from './shortform-route-helpers';

export function registerShortformLibraryRoutes(shortform: Hono): void {
  shortform.get('/videos/my', (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

    return jsonSuccess(listMyShortformVideos(user.id));
  });

  shortform.get('/video/:id', (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;

    const video = getShortformVideoDetail(c.req.param('id'));
    if (!video) {
      return jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404);
    }

    return jsonSuccess(video);
  });

  shortform.post('/share', async (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

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
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

    const courseId = c.req.query('course_id')?.trim();
    return jsonSuccess(listShortformCommunity(user.id, courseId || undefined));
  });

  shortform.post('/save', async (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

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
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

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
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

    return jsonSuccess(listMyShortformLibrary(user.id));
  });
}
