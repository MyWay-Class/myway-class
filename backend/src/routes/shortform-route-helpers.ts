import { getShortformVideoDetail, updateVideoExport, type AuthUser } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';
import { verifyMediaCallbackSecret } from '../lib/media-processor';
import { createMediaRepository } from '../lib/media-repository';
import { dispatchShortformExportJob } from '../lib/shortform-export';
import type { RuntimeBindings } from '../lib/runtime-env';

export const DEMO_SHORTFORM_EXPORT_URL = '/static/shortforms/demo-export.mp4';

function buildExportCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/v1/shortform/export/callback`;
}

export function buildShortformExportFallbackUpdate() {
  return {
    export_status: 'COMPLETED' as const,
    export_result_url: DEMO_SHORTFORM_EXPORT_URL,
    video_url: DEMO_SHORTFORM_EXPORT_URL,
    export_error_message: '미디어 처리 서비스가 없어 데모 영상으로 대체했습니다.',
    export_failure_reason: 'processor_unavailable_demo_fallback',
    export_job_id: null,
  };
}

export function getMediaRepository(env: RuntimeBindings | undefined) {
  return env?.MEDIA_DB ? createMediaRepository(env.MEDIA_DB) : undefined;
}

export function requireAuth(request: Request): AuthUser | Response {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }
  return user;
}

export function verifyShortformCallbackSecret(request: Request, env: RuntimeBindings | undefined): Response | null {
  if (!verifyMediaCallbackSecret(request, env)) {
    return jsonFailure('FORBIDDEN', '유효한 callback secret이 필요합니다.', 403);
  }
  return null;
}

export async function startShortformExport(
  shortformId: string,
  requestUrl: string,
  env: RuntimeBindings | undefined,
): Promise<{ ok: true; payload: Response } | { ok: false; response: Response }> {
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
    const isDeferredExport = exportResult.reason === 'not_configured' || exportResult.reason === 'dispatch_failed';
    const updated = updateVideoExport(
      shortformId,
      isDeferredExport
        ? buildShortformExportFallbackUpdate()
        : {
            export_status: 'FAILED',
            export_error_message: exportResult.message,
            export_failure_reason: exportResult.reason,
            export_result_url: null,
            export_job_id: null,
          },
    );

    if (isDeferredExport) {
      return {
        ok: true,
        payload: jsonSuccess(
          getShortformVideoDetail(shortformId) ?? updated,
          '숏폼은 생성되었고 배포 환경에서는 데모 영상으로 완료했습니다.',
          201,
        ),
      };
    }

    return {
      ok: false,
      response: jsonSuccess(
        getShortformVideoDetail(shortformId) ?? updated,
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
    payload: jsonSuccess(getShortformVideoDetail(shortformId) ?? updated ?? detail, '숏폼 export job이 시작되었습니다.', 201),
  };
}
