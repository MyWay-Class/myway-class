import { canManageCourses, demoLectures, getCourseDetail, getLectureDetail, type MediaRepository } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure } from '../lib/http';
import { verifyMediaProcessorToken } from '../lib/media-processor';
import { createMediaRepository } from '../lib/media-repository';
import type { RuntimeBindings } from '../lib/runtime-env';

export function requireUser(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return { error: jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401) as Response };
  }
  return { user };
}

export function ensureLectureExists(lectureId: string, userId: string): boolean {
  return Boolean(getLectureDetail(lectureId, userId));
}

export function canAccessLectureContent(user: ReturnType<typeof getAuthenticatedUser>, lectureId: string): boolean {
  if (!user) {
    return false;
  }
  const lecture = getLectureDetail(lectureId, user.id);
  if (!lecture) {
    return false;
  }
  if (canManageCourses(user.role)) {
    return true;
  }
  const course = getCourseDetail(lecture.course_id, user.id);
  return Boolean(course?.enrolled);
}

function normalizeAssetKey(assetKey: string): string {
  return assetKey
    .trim()
    .split('/')
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => segment.trim())
    .join('/');
}

function matchesLectureAssetKey(lecture: { video_asset_key?: string | null; video_url?: string | null }, assetKey: string): boolean {
  const normalizedAssetKey = normalizeAssetKey(assetKey);
  const encodedAssetKey = normalizedAssetKey
    .split('/')
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  if (lecture.video_asset_key) {
    const lectureAssetKey = normalizeAssetKey(lecture.video_asset_key);
    if (lectureAssetKey === normalizedAssetKey || lectureAssetKey === encodedAssetKey) {
      return true;
    }
  }

  if (lecture.video_url) {
    const marker = '/api/v1/media/assets/';
    const markerIndex = lecture.video_url.indexOf(marker);
    if (markerIndex >= 0) {
      const rawAssetKey = lecture.video_url.slice(markerIndex + marker.length);
      const decodedAssetKey = decodeURIComponent(rawAssetKey);
      if (
        rawAssetKey === normalizedAssetKey ||
        rawAssetKey === encodedAssetKey ||
        decodedAssetKey === normalizedAssetKey ||
        decodedAssetKey === encodedAssetKey
      ) {
        return true;
      }
    }
  }

  return false;
}

function findLectureIdByAssetKey(assetKey: string): string | null {
  const matchedLecture = demoLectures.find((lecture) => matchesLectureAssetKey(lecture, assetKey));
  return matchedLecture?.id ?? null;
}

export function getMediaRepository(env: RuntimeBindings | undefined): MediaRepository | undefined {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

export function requireLectureAccess(
  request: Request,
  lectureId: string,
  unauthMessage: string,
  forbiddenMessage: string,
): { user: NonNullable<ReturnType<typeof getAuthenticatedUser>> } | { error: Response } {
  const user = getAuthenticatedUser(request);
  if (!canAccessLectureContent(user, lectureId)) {
    return {
      error: jsonFailure(user ? 'FORBIDDEN' : 'UNAUTHENTICATED', user ? forbiddenMessage : unauthMessage, user ? 403 : 401),
    };
  }
  return { user: user! };
}

export function requireAssetAccess(
  request: Request,
  assetKey: string,
  env: RuntimeBindings | undefined,
): Response | null {
  if (request.headers.get('x-media-processor-token') && verifyMediaProcessorToken(request, env)) {
    return null;
  }

  const user = getAuthenticatedUser(request);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const lectureId = findLectureIdByAssetKey(assetKey);
  if (!lectureId || !canAccessLectureContent(user, lectureId)) {
    return jsonFailure('FORBIDDEN', '수강 신청 후에 영상을 시청할 수 있습니다.', 403);
  }

  return null;
}
