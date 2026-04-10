import { Hono } from 'hono';
import { getAIProviderRuntimeOverview } from '../lib/ai-provider';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';
import type { RuntimeBindings } from '../lib/runtime-env';

const aiProviders = new Hono();

aiProviders.get('/', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const env = c.env as RuntimeBindings | undefined;

  return jsonSuccess(
    {
      ...getAIProviderRuntimeOverview(env),
      requested_by: user.role,
    },
    'AI provider 구성을 조회했습니다.',
  );
});

export default aiProviders;
