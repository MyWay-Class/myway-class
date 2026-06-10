import { Hono } from 'hono';
import {
  getShortformExtractionById,
  getShortformVideoDetail,
  listMyShortformVideos,
  toggleShortformCandidateSelection,
  upsertShortformVideo,
  updateVideoExport,
  type ShortformComposeRequest,
  type ShortformGenerateRequest,
  type ShortformSelectRequest,
  type ShortformVideo,
} from '@myway/shared';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import type { RuntimeBindings } from '../lib/runtime-env';
import { composeShortformAndMarkProcessing, generateShortformCandidates } from './shortform-route-actions';
import {
  getMediaRepository,
  requireAuth,
  startShortformExport,
  verifyShortformCallbackSecret,
} from './shortform-route-helpers';

type ShortformExportCallbackRequest = {
  shortform_id: string;
  video_id?: string;
  status: 'COMPLETED' | 'FAILED';
  video_url?: string;
  error_message?: string;
  failure_reason?: string;
  processing_job_id?: string;
  processing_stage?: string;
  processing_step?: string;
};

export function registerShortformProcessingRoutes(shortform: Hono): void {
  shortform.post('/generate', async (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

    const body = await readJsonBody<ShortformGenerateRequest>(c.req.raw);
    if (!body?.course_id?.trim()) {
      return jsonFailure('COURSE_ID_REQUIRED', 'course_id가 필요합니다.');
    }

    const extraction = await generateShortformCandidates(user.id, body, getMediaRepository(c.env as RuntimeBindings | undefined));
    if (!extraction) return jsonFailure('COURSE_ID_REQUIRED', 'course_id가 필요합니다.');

    return jsonSuccess(
      extraction,
      '숏폼 후보가 생성되었습니다.',
      201,
    );
  });

  shortform.put('/candidates/select', async (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;

    const body = await readJsonBody<ShortformSelectRequest>(c.req.raw);
    if (!body?.candidate_ids?.length) {
      return jsonFailure('CANDIDATE_IDS_REQUIRED', 'candidate_ids가 필요합니다.');
    }

    return jsonSuccess(toggleShortformCandidateSelection(body), '후보 선택이 반영되었습니다.');
  });

  shortform.get('/extraction/:id', (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;

    const extraction = getShortformExtractionById(c.req.param('id'));
    if (!extraction) {
      return jsonFailure('EXTRACTION_NOT_FOUND', '추출 결과를 찾을 수 없습니다.', 404);
    }

    return jsonSuccess(extraction);
  });

  shortform.post('/compose', async (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

    const body = await readJsonBody<ShortformComposeRequest>(c.req.raw);
    const hasTimelineClips = (body?.timeline_project?.clips?.length ?? 0) > 0 || (body?.clips?.length ?? 0) > 0;
    if (!body?.title?.trim() || (!body?.extraction_id?.trim() && !hasTimelineClips)) {
      return jsonFailure('SHORTFORM_FIELDS_REQUIRED', 'title과 extraction_id 또는 clips가 필요합니다.');
    }

    const video = composeShortformAndMarkProcessing(user.id, body);
    if (!video?.id) {
      return jsonFailure('SHORTFORM_COMPOSE_FAILED', '숏폼을 생성할 수 없습니다.', 400);
    }

    const exportStart = await startShortformExport(video.id, c.req.url, c.env as RuntimeBindings | undefined);
    if (!exportStart.ok) {
      return exportStart.response;
    }
    return exportStart.payload as Response;
  });

  shortform.post('/export/callback', async (c) => {
    const callbackAuthError = verifyShortformCallbackSecret(c.req.raw, c.env as RuntimeBindings | undefined);
    if (callbackAuthError) return callbackAuthError;

    const body = await readJsonBody<ShortformExportCallbackRequest>(c.req.raw);
    if (!body) {
      return jsonFailure('INVALID_BODY', '요청 본문이 올바르지 않습니다.', 400);
    }

    const videoId = body.video_id?.trim() || body.shortform_id?.trim();
    if (!videoId) {
      return jsonFailure('SHORTFORM_ID_REQUIRED', 'shortform_id가 필요합니다.', 400);
    }

    const current = getShortformVideoDetail(videoId);
    const currentOrPlaceholder = current ?? upsertShortformVideo({
      id: videoId,
      shortform_id: body.shortform_id?.trim() || videoId,
      user_id: 'system',
      title: videoId,
      description: '',
      duration_ms: 0,
      total_segments: 0,
      course_id: 'course_unknown',
      source_lecture_ids: [],
      status: 'GENERATED',
      video_url: body.video_url?.trim() || `/static/shortforms/${videoId}.mp4`,
      export_status: 'PENDING',
      export_job_id: null,
      export_result_url: null,
      export_failure_reason: null,
      export_error_message: null,
      export_retry_count: 0,
      updated_at: new Date().toISOString(),
      share_count: 0,
      like_count: 0,
      save_count: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
    } satisfies ShortformVideo);

    const next = updateVideoExport(currentOrPlaceholder.id, {
      export_status: body.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
      export_result_url: body.video_url?.trim() ?? currentOrPlaceholder.export_result_url,
      export_error_message: body.error_message?.trim() ?? null,
      export_failure_reason: body.failure_reason?.trim() ?? null,
      export_job_id: body.processing_job_id?.trim() ?? currentOrPlaceholder.export_job_id,
      video_url: body.status === 'COMPLETED' && body.video_url?.trim() ? body.video_url.trim() : currentOrPlaceholder.video_url,
    });

    if (!next) {
      return jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404);
    }

    return jsonSuccess(next, body.status === 'FAILED' ? '숏폼 export가 실패했습니다.' : '숏폼 export가 완료되었습니다.');
  });

  shortform.post('/:shortformId/export/retry', async (c) => {
    const auth = requireAuth(c.req.raw);
    if (auth instanceof Response) return auth;
    const user = auth;

    const shortformId = c.req.param('shortformId');
    const current = getShortformVideoDetail(shortformId);
    if (!current) {
      return jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404);
    }

    if (current.user_id !== user.id) {
      return jsonFailure('FORBIDDEN', '본인 숏폼만 다시 내보낼 수 있습니다.', 403);
    }

    const retried = updateVideoExport(shortformId, {
      export_status: 'PROCESSING',
      export_retry_count: current.export_retry_count + 1,
      export_error_message: null,
      export_failure_reason: null,
    });

    if (!retried) {
      return jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404);
    }

    const exportStart = await startShortformExport(shortformId, c.req.url, c.env as RuntimeBindings | undefined);
    if (!exportStart.ok) {
      return exportStart.response;
    }
    const next = getShortformVideoDetail(shortformId);
    return jsonSuccess(next ?? retried, '숏폼 export job이 다시 시작되었습니다.', 202);
  });
}
