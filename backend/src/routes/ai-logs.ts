import { Hono } from 'hono';
import { getAILogOverviewForUser } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';

const aiLogs = new Hono();

aiLogs.get('/', (c) => {
  const user = getAuthenticatedUser(c.req.raw);

  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(getAILogOverviewForUser(user.id), 'AI 로그를 조회했습니다.');
});

export default aiLogs;
