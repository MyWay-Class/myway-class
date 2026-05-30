import { Hono } from 'hono';
import {
  composeShortformVideo,
  getCourseDetail,
  getShortformVideoDetail,
  generateShortformExtraction,
  getShortformExtractionById,
  listMyShortformLibrary,
  listMyShortformVideos,
  listShortformCommunity,
  saveShortformVideo,
  shareShortformVideo,
  updateVideoExport,
  toggleShortformCandidateSelection,
  toggleShortformLike,
  listLectureTranscripts,
  type ShortformComposeRequest,
  type ShortformGenerateRequest,
  type ShortformLikeRequest,
  type ShortformSaveRequest,
  type ShortformSelectRequest,
  type ShortformShareRequest,
} from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import { dispatchShortformExportJob } from '../lib/shortform-export';
import { verifyMediaCallbackSecret } from '../lib/media-processor';
import { createMediaRepository } from '../lib/media-repository';
import type { RuntimeBindings } from '../lib/runtime-env';
import type { AuthUser } from '@myway/shared';

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

function buildExportCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/v1/shortform/export/callback`;
}

const shortform = new Hono();

function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

function requireAuth(request: Request): AuthUser | Response {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }
  return user;
}

async function startShortformExport(
  shortformId: string,
  requestUrl: string,
  env: RuntimeBindings | undefined,
): Promise<
  | { ok: true; payload: unknown }
  | { ok: false; response: Response }
> {
  const detail = getShortformVideoDetail(shortformId);
  if (!detail) {
    return {
      ok: false,
      response: jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404),
    };
  }

  const exportResult = await dispatchShortformExportJob(
    {
      shortform: detail,
      clips: detail.clips,
      source_base_url: requestUrl,
      callback_url: buildExportCallbackUrl(requestUrl),
    },
    env,
  );

  if (!exportResult.ok) {
    updateVideoExport(shortformId, {
      export_status: 'FAILED',
      export_error_message: exportResult.message,
      export_failure_reason: exportResult.reason,
      export_result_url: null,
      export_job_id: null,
    });

    return {
      ok: false,
      response: jsonSuccess(
        updateVideoExport(shortformId, {
          export_status: 'FAILED',
          export_error_message: exportResult.message,
          export_failure_reason: exportResult.reason,
        }),
        '숏폼은 생성되었지만 export job을 시작하지 못했습니다.',
        201,
      ),
    };
  }

  const updated = updateVideoExport(shortformId, {
    export_status: exportResult.status,
    export_job_id: exportResult.job_id,
    export_error_message: null,
    export_failure_reason: null,
  });

  return {
    ok: true,
    payload: jsonSuccess(updated ?? detail, '숏폼 export job이 시작되었습니다.', 201),
  };
}

shortform.post('/generate', async (c) => {
  const auth = requireAuth(c.req.raw);
  if (auth instanceof Response) return auth;
  const user = auth;

  const body = await readJsonBody<ShortformGenerateRequest>(c.req.raw);
  const courseId = body?.course_id?.trim();
  if (!courseId) {
    return jsonFailure('COURSE_ID_REQUIRED', 'course_id가 필요합니다.');
  }

  const repository = getMediaRepository(c.env as RuntimeBindings | undefined);
  const transcriptSegmentsByLecture: Record<string, Array<{ start_ms: number; end_ms: number; text: string }>> = {};
  const course = getCourseDetail(courseId, user.id);
  const lectureIds = body?.mode === 'single' && body?.lecture_id?.trim()
    ? [body.lecture_id.trim()]
    : course?.lectures.map((lecture) => lecture.id) ?? [];

  if (repository && lectureIds.length > 0) {
    for (const lectureId of lectureIds) {
      const transcript = (await listLectureTranscripts(lectureId, repository))[0] ?? null;
      if (transcript?.segments?.length) {
        transcriptSegmentsByLecture[lectureId] = transcript.segments.map((segment) => ({
          start_ms: segment.start_ms,
          end_ms: segment.end_ms,
          text: segment.text,
        }));
      }
    }
  }

  return jsonSuccess(
    generateShortformExtraction(user.id, {
      lecture_id: body?.lecture_id?.trim(),
      course_id: courseId,
      mode: body?.mode ?? 'cross',
      style: body?.style ?? 'highlight',
      target_duration_sec: body?.target_duration_sec ?? 300,
      language: body?.language ?? 'ko',
      transcript_segments_by_lecture: transcriptSegmentsByLecture,
    }),
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

  updateVideoExport(video.id, {
    export_status: 'PROCESSING',
    export_error_message: null,
    export_failure_reason: null,
    export_result_url: null,
    export_job_id: null,
    export_retry_count: 0,
  });

  const exportStart = await startShortformExport(video.id, c.req.url, c.env as RuntimeBindings | undefined);
  if (!exportStart.ok) {
    return exportStart.response;
  }
  return exportStart.payload as Response;
});

shortform.post('/export/callback', async (c) => {
  if (!verifyMediaCallbackSecret(c.req.raw, c.env as RuntimeBindings | undefined)) {
    return jsonFailure('FORBIDDEN', '유효한 callback secret이 필요합니다.', 403);
  }

  const body = await readJsonBody<ShortformExportCallbackRequest>(c.req.raw);
  if (!body) {
    return jsonFailure('INVALID_BODY', '요청 본문이 올바르지 않습니다.', 400);
  }

  const videoId = body.video_id?.trim() || body.shortform_id?.trim();
  if (!videoId) {
    return jsonFailure('SHORTFORM_ID_REQUIRED', 'shortform_id가 필요합니다.', 400);
  }

  const current = getShortformVideoDetail(videoId);
  if (!current) {
    return jsonFailure('SHORTFORM_NOT_FOUND', '숏폼을 찾을 수 없습니다.', 404);
  }

  const next = updateVideoExport(current.id, {
    export_status: body.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
    export_result_url: body.video_url?.trim() ?? current.export_result_url,
    export_error_message: body.error_message?.trim() ?? null,
    export_failure_reason: body.failure_reason?.trim() ?? null,
    export_job_id: body.processing_job_id?.trim() ?? current.export_job_id,
    video_url: body.status === 'COMPLETED' && body.video_url?.trim() ? body.video_url.trim() : current.video_url,
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

export default shortform;
