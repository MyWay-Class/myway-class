import { Hono } from 'hono';
import { getAIInsightsForUser } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';

const aiInsights = new Hono();

aiInsights.get('/', (c) => {
  const user = getAuthenticatedUser(c.req.raw);

  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(getAIInsightsForUser(user.id), 'AI 인사이트를 조회했습니다.');
});

export default aiInsights;
