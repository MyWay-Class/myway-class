import { Hono } from 'hono';
import { jsonSuccess } from '../lib/http';

const health = new Hono();

health.get('/', () =>
  jsonSuccess({
    status: 'ok',
    service: 'myway-class-backend',
    timestamp: new Date().toISOString(),
  }),
);

export default health;
