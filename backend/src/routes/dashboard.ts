import { Hono } from 'hono';
import { getDashboard } from '@myway/shared';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';

const dashboard = new Hono();

dashboard.get('/', (c) => {
  const user = getAuthenticatedUser(c.req.raw);

  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(getDashboard(user.id));
});

export default dashboard;
