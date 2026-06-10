import { getSession } from './auth';

const request = new Request('http://localhost/api/v1/auth/me', {
  headers: {
    Authorization: 'Bearer session_usr_std_001',
  },
});

const session = getSession(request);

if (session?.session_token !== 'session_usr_std_001') throw new Error('Unexpected session token');
if (session?.user.id !== 'usr_std_001') throw new Error('Unexpected user id');
if (session?.user.role !== 'STUDENT') throw new Error('Unexpected role');

console.log('auth regression passed');
