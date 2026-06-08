import { Hono } from 'hono';
import { type AudioExtractionCallbackRequest } from '@myway/shared';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';
import type { RuntimeBindings } from '../lib/runtime-env';
import { extractionCallbackAction } from './media-route-actions';
import { getMediaRepository } from './media-route-guards';
import { verifyMediaCallbackSecret } from '../lib/media-processor';

export function registerMediaAdminCallbackRoutes(media: Hono): void {
  media.post('/extract-audio/callback', async (c) => {
    if (!verifyMediaCallbackSecret(c.req.raw, c.env as RuntimeBindings | undefined)) {
      return jsonFailure('FORBIDDEN', '유효한 callback secret이 필요합니다.', 403);
    }

    const body = await readJsonBody<AudioExtractionCallbackRequest>(c.req.raw);
    if (!body?.lecture_id?.trim()) {
      return jsonFailure('LECTURE_ID_REQUIRED', 'lecture_id가 필요합니다.');
    }

    const callback = await extractionCallbackAction(body, c.env as RuntimeBindings | undefined, getMediaRepository(c.env as RuntimeBindings | undefined));
    const callbackError = 'error' in callback ? callback.error ?? 'CALLBACK_INVALID' : null;
    if (callbackError) {
      if (callbackError === 'CALLBACK_INVALID') {
        return jsonFailure('CALLBACK_INVALID', 'callback payload가 올바르지 않습니다.', 400);
      }
      const status = callbackError === 'extraction_not_found' ? 404 : callbackError === 'transcript_failed' ? 502 : 400;
      return jsonFailure(callbackError.toUpperCase(), callback.message ?? 'callback 처리에 실패했습니다.', status);
    }

    if (!callback.payload) {
      return jsonFailure('CALLBACK_INVALID', 'callback payload가 올바르지 않습니다.', 400);
    }

    return jsonSuccess(
      callback.payload,
      '오디오 추출 callback이 반영되었습니다.',
    );
  });
}
