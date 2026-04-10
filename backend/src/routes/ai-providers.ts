import { Hono } from 'hono';
import { getAIProviderOverview } from '../lib/ai-provider';
import { getAuthenticatedUser } from '../lib/auth';
import { jsonFailure, jsonSuccess } from '../lib/http';
import { getAIRuntimePolicy, type RuntimeBindings } from '../lib/runtime-env';

const aiProviders = new Hono();

aiProviders.get('/', (c) => {
  const user = getAuthenticatedUser(c.req.raw);
  if (!user) {
    return jsonFailure('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  }

  const env = c.env as RuntimeBindings | undefined;
  const policy = getAIRuntimePolicy(env);

  return jsonSuccess(
    {
      ...getAIProviderOverview(),
      runtime_policy: policy,
      active_provider: policy.public_mode === 'dev' ? 'ollama' : 'gemini',
      requested_by: user.role,
    },
    'AI provider 구성을 조회했습니다.',
  );
});

export default aiProviders;
