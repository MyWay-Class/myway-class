import { Hono } from 'hono';
import { type STTProviderCatalog } from '@myway/shared';
import { jsonFailure, jsonSuccess } from '../lib/http';
import { getSTTProviderOverview } from '../lib/stt-provider';
import type { RuntimeBindings } from '../lib/runtime-env';
import { loadMediaProcessorHealth } from '../lib/media-processor';
import { requireUser } from './media-route-guards';

export function registerMediaAdminObservabilityRoutes(media: Hono): void {
  media.get('/providers', (c) => jsonSuccess(getSTTProviderOverview() satisfies STTProviderCatalog, 'STT provider 계층을 조회했습니다.'));

  media.get('/processor-health', async (c) => {
    const auth = requireUser(c.req.raw);
    if ('error' in auth) return auth.error;

    const health = await loadMediaProcessorHealth(c.env as RuntimeBindings | undefined);
    if (!health) {
      return jsonFailure('MEDIA_PROCESSOR_UNAVAILABLE', '미디어 처리 서비스 상태를 가져올 수 없습니다.', 503);
    }

    return jsonSuccess(health, '미디어 처리 서비스 상태를 조회했습니다.');
  });
}
