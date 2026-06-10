import { Hono } from 'hono';
import { buildPipelineOverview, getCourseDetail, getLectureDetail, listAudioExtractions, listLectureNotes, listLectureTranscripts } from '@myway/shared';
import { jsonFailure, jsonSuccess } from '../lib/http';
import { readLectureVideoAsset } from '../lib/media-assets';
import { buildFallbackLectureTranscript } from '../lib/transcript-fallback';
import type { RuntimeBindings } from '../lib/runtime-env';
import { ensureLectureExists, getMediaRepository, requireAssetAccess, requireLectureAccess } from './media-route-guards';

async function withLectureAccessResponse<T>(
  c: { req: { raw: Request; param: (name: string) => string }; env: unknown },
  lectureId: string,
  unauthMessage: string,
  forbiddenMessage: string,
  producer: (
    repository: ReturnType<typeof getMediaRepository>,
    userId: string,
  ) => Promise<T>,
): Promise<Response> {
  const access = requireLectureAccess(c.req.raw, lectureId, unauthMessage, forbiddenMessage);
  if ('error' in access) return access.error;
  if (!ensureLectureExists(lectureId, access.user.id)) {
    return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
  }
  return jsonSuccess(await producer(getMediaRepository(c.env as RuntimeBindings | undefined), access.user.id));
}

export function registerMediaPublicRoutes(media: Hono): void {
  media.get('/assets/:assetKey', async (c) => {
    const assetKey = c.req.param('assetKey');
    const accessError = requireAssetAccess(c.req.raw, assetKey, c.env as RuntimeBindings | undefined);
    if (accessError) return accessError;

    const response = await readLectureVideoAsset(assetKey, c.env as RuntimeBindings | undefined);
    if (!response) {
      return jsonFailure('ASSET_NOT_FOUND', '미디어 파일을 찾을 수 없습니다.', 404);
    }

    return response;
  });

  media.get('/transcript/:lectureId', async (c) => {
    const lectureId = c.req.param('lectureId');
    return withLectureAccessResponse(
      c,
      lectureId,
      '강의 수강 후에 스크립트를 볼 수 있습니다.',
      '강의 수강 후에 스크립트를 볼 수 있습니다.',
      async (repository, userId) => {
        const transcript = (await listLectureTranscripts(lectureId, repository))[0] ?? null;
        if (transcript) return transcript;
        return buildFallbackLectureTranscript(getLectureDetail(lectureId, userId) ?? null);
      },
    );
  });

  media.get('/lecture-video/:lectureId', async (c) => {
    const lectureId = c.req.param('lectureId');
    const access = requireLectureAccess(c.req.raw, lectureId, '강의 수강 후에 영상을 볼 수 있습니다.', '강의 수강 후에 영상을 볼 수 있습니다.');
    if ('error' in access) return access.error;
    if (!ensureLectureExists(lectureId, access.user.id)) {
      return jsonFailure('LECTURE_NOT_FOUND', '강의를 찾을 수 없습니다.', 404);
    }

    const lecture = getLectureDetail(lectureId, access.user.id);
    if (!lecture) {
      return jsonFailure('LECTURE_VIDEO_NOT_FOUND', '연결된 강의 영상 에셋이 없습니다.', 404);
    }

    const course = getCourseDetail(lecture.course_id, access.user.id);
    const courseLecture = course?.lectures.find((item) => item.id === lectureId) ?? lecture;
    const assetKey =
      courseLecture.video_asset_key ??
      (courseLecture.video_url?.includes('/api/v1/media/assets/')
        ? decodeURIComponent(courseLecture.video_url.slice(courseLecture.video_url.indexOf('/api/v1/media/assets/') + '/api/v1/media/assets/'.length))
        : undefined);

    if (!assetKey && !courseLecture.video_url && !lecture.video_url) {
      return jsonFailure('LECTURE_VIDEO_NOT_FOUND', '연결된 강의 영상 에셋이 없습니다.', 404);
    }

    return jsonSuccess({
      lecture_id: lecture.id,
      asset_key: assetKey,
      video_url: courseLecture.video_url || lecture.video_url,
    });
  });

  media.get('/notes/:lectureId', async (c) => {
    const lectureId = c.req.param('lectureId');
    return withLectureAccessResponse(
      c,
      lectureId,
      '강의 수강 후에 자료를 볼 수 있습니다.',
      '강의 수강 후에 자료를 볼 수 있습니다.',
      async (repository) => listLectureNotes(lectureId, repository),
    );
  });

  media.get('/audio-extractions/:lectureId', async (c) => {
    const lectureId = c.req.param('lectureId');
    return withLectureAccessResponse(
      c,
      lectureId,
      '강의 수강 후에 추출 기록을 볼 수 있습니다.',
      '강의 수강 후에 추출 기록을 볼 수 있습니다.',
      async (repository) => listAudioExtractions(lectureId, repository),
    );
  });

  media.get('/pipeline/:lectureId', async (c) => {
    const lectureId = c.req.param('lectureId');
    return withLectureAccessResponse(
      c,
      lectureId,
      '강의 수강 후에 파이프라인 상태를 볼 수 있습니다.',
      '강의 수강 후에 파이프라인 상태를 볼 수 있습니다.',
      async (repository) => buildPipelineOverview(lectureId, repository),
    );
  });
}
