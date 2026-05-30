import { canManageCourses, getCourseDetail, getLectureDetail, type MediaRepository } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure } from '../lib/http';
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
