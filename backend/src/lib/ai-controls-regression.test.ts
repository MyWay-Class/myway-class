import { jsonFailure } from './http';

const response = jsonFailure('AI_QUOTA_EXCEEDED', '일일 사용 한도를 초과했습니다.', 429, {
  role: 'student',
  feature: 'summary',
  limit: 1,
  remaining: 0,
  reset_at: '2026-06-09T00:00:00.000Z',
});

if (response.status !== 429) throw new Error(`Expected 429, got ${response.status}`);
if (response.headers.get('x-ai-quota-remaining') !== '0') throw new Error('Missing remaining header');
if (response.headers.get('x-ai-quota-reset') !== '2026-06-09T00:00:00.000Z') throw new Error('Missing reset header');
if (response.headers.get('x-ai-quota-role') !== 'student') throw new Error('Missing role header');
if (response.headers.get('x-ai-quota-feature') !== 'summary') throw new Error('Missing feature header');
if (response.headers.get('x-ai-quota-limit') !== '1') throw new Error('Missing limit header');

console.log('ai controls regression passed');
