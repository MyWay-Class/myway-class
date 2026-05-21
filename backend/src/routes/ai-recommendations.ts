import { Hono } from 'hono';
import {
  getAIRecommendationsForUser,
  getAIUserSettings,
  updateAIUserSettings,
  type AIUserSettingsUpdateRequest,
} from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

const aiRecommendations = new Hono();

aiRecommendations.get('/recommendations', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(getAIRecommendationsForUser(user.id), 'AI 추천을 조회했습니다.');
});

aiRecommendations.get('/settings', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(getAIUserSettings(user.id), 'AI 설정을 조회했습니다.');
});

aiRecommendations.put('/settings', async (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const body = await readJsonBody<AIUserSettingsUpdateRequest>(c.req.raw);
  if (!body) {
    return jsonFailure('SETTINGS_REQUIRED', '저장할 설정이 필요합니다.');
  }

  const settings = updateAIUserSettings(user.id, body);
  return jsonSuccess(settings, 'AI 설정이 저장되었습니다.');
});

export default aiRecommendations;
