import { Hono } from 'hono';
import { jsonFailure, jsonSuccess } from '../lib/http';
import { refreshLearningStoreFromDatabase } from '../lib/learning-store';
import type { RuntimeBindings } from '../lib/runtime-env';

const dev = new Hono();

dev.post('/learning-store/reload', async (c) => {
  const env = c.env as RuntimeBindings | undefined;
  if (env?.APP_ENV !== 'development') {
    return jsonFailure('NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.', 404);
  }

  try {
    await refreshLearningStoreFromDatabase(env);
  } catch (error) {
    const message = error instanceof Error ? error.message : '학습 저장소를 다시 불러오지 못했습니다.';
    console.error('failed to reload learning store', error);
    return jsonFailure('LEARNING_STORE_RELOAD_FAILED', message, 500);
  }

  return jsonSuccess({ reloaded: true }, '학습 저장소를 다시 불러왔습니다.');
});

export default dev;
