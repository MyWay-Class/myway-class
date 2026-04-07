import { Hono } from 'hono';
import { demoUsers, getDemoUser } from '@myway/shared';
import { destroySession, describeSession, getSession, loginUser } from '../lib/auth';
import { jsonFailure, jsonSuccess, readJsonBody } from '../lib/http';

type LoginBody = {
  userId?: string;
};

const auth = new Hono();

auth.get('/users', () =>
  jsonSuccess(
    demoUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      bio: user.bio,
    })),
  ),
);

auth.post('/login', async (c) => {
  const body = await readJsonBody<LoginBody>(c.req.raw);
  const userId = body?.userId?.trim();

  if (!userId) {
    return jsonFailure('USER_ID_REQUIRED', '로그인할 사용자 식별자가 필요합니다.');
  }

  const user = getDemoUser(userId);
  if (!user) {
    return jsonFailure('USER_NOT_FOUND', '사용자를 찾을 수 없습니다.', 404);
  }

  const session = loginUser(user.id);
  if (!session) {
    return jsonFailure('SESSION_CREATE_FAILED', '세션을 생성할 수 없습니다.', 500);
  }

  return jsonSuccess(describeSession(session), '로그인되었습니다.');
});

auth.get('/me', (c) => {
  const session = getSession(c.req.raw);

  if (!session) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  return jsonSuccess(describeSession(session));
});

auth.post('/logout', (c) => {
  const session = getSession(c.req.raw);

  if (session) {
    destroySession(c.req.raw);
  }

  return jsonSuccess({ logged_out: true }, '로그아웃되었습니다.');
});

export default auth;
