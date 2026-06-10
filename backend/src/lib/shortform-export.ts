import type { ShortformClip, ShortformVideo } from '@myway/shared';
import { getMediaProcessorRuntimeSettings, type RuntimeBindings } from './runtime-env';

type ShortformExportDispatchInput = {
  shortform: ShortformVideo;
  clips: ShortformClip[];
  source_base_url: string;
  callback_url: string;
};

type ShortformExportDispatchResult =
  | {
      ok: true;
      job_id: string | null;
      status: 'PENDING' | 'PROCESSING';
    }
  | {
      ok: false;
      reason: 'not_configured' | 'dispatch_failed';
      message: string;
    };

type ShortformExportResponse = {
  job_id?: string;
  status?: 'PENDING' | 'PROCESSING';
};

function getMediaProcessorOrigin(url: string): string {
  return new URL(url).origin;
}

function isLoopbackMediaProcessor(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1';
  } catch {
    return false;
  }
}

function buildMediaProcessorAuthHeaders(token?: string): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    'x-myway-media-processor-token': token,
    'x-media-processor-token': token,
    'x-processor-token': token,
  };
}

export async function dispatchShortformExportJob(
  input: ShortformExportDispatchInput,
  env?: RuntimeBindings,
): Promise<ShortformExportDispatchResult> {
  const settings = getMediaProcessorRuntimeSettings(env);
  if (!settings.url) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'MYWAY_MEDIA_PROCESSOR_URL이 설정되지 않았습니다.',
    };
  }
  if (isLoopbackMediaProcessor(settings.url)) {
    return {
      ok: false,
      reason: 'not_configured',
      message: '배포 환경에서는 로컬 미디어 처리 서비스 URL을 사용할 수 없습니다.',
    };
  }

  const response = await fetch(`${getMediaProcessorOrigin(settings.url)}/jobs/shortform-export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildMediaProcessorAuthHeaders(settings.token),
    },
    body: JSON.stringify({
      shortform_id: input.shortform.id,
      course_id: input.shortform.course_id,
      title: input.shortform.title,
      description: input.shortform.description,
      clips: input.clips.map((clip) => ({
        lecture_id: clip.lecture_id,
        lecture_title: clip.lecture_title,
        course_id: clip.course_id,
        start_time_ms: clip.start_time_ms,
        end_time_ms: clip.end_time_ms,
        label: clip.label,
        description: clip.description,
        order_index: clip.order_index,
        source_video_url: new URL(clip.source_video_url, input.source_base_url).toString(),
      })),
      callback: {
        url: input.callback_url,
        secret: settings.callback_secret ?? null,
      },
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: 'dispatch_failed',
      message: `미디어 처리 서비스 요청에 실패했습니다. (${response.status})`,
    };
  }

  const payload = (await response.json().catch(() => null)) as ShortformExportResponse | null;
  return {
    ok: true,
    job_id: payload?.job_id ?? null,
    status: payload?.status ?? 'PROCESSING',
  };
}
