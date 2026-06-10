import assert from 'node:assert/strict';
import { getSession } from './auth';

const request = new Request('http://localhost/api/v1/auth/me', {
  headers: {
    Authorization: 'Bearer session_usr_std_001',
  },
});

const session = getSession(request);

assert.equal(session?.session_token, 'session_usr_std_001');
assert.equal(session?.user.id, 'usr_std_001');
assert.equal(session?.user.role, 'STUDENT');

console.log('auth regression passed');
