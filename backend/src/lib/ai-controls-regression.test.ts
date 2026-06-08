import assert from 'node:assert/strict';
import { jsonFailure } from './http';

const response = jsonFailure('AI_QUOTA_EXCEEDED', '일일 사용 한도를 초과했습니다.', 429, {
  role: 'student',
  feature: 'summary',
  limit: 1,
  remaining: 0,
  reset_at: '2026-06-09T00:00:00.000Z',
});

assert.equal(response.status, 429);
assert.equal(response.headers.get('x-ai-quota-remaining'), '0');
assert.equal(response.headers.get('x-ai-quota-reset'), '2026-06-09T00:00:00.000Z');
assert.equal(response.headers.get('x-ai-quota-role'), 'student');
assert.equal(response.headers.get('x-ai-quota-feature'), 'summary');
assert.equal(response.headers.get('x-ai-quota-limit'), '1');

console.log('ai controls regression passed');
