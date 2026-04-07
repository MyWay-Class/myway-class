import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jsonSuccess } from './lib/http';
import { registerRoutes } from './routes';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
  }),
);

app.get('/', () =>
  jsonSuccess({
    service: 'myway-class-backend',
    status: 'ready',
    documentation: '/api/v1/health',
  }),
);

registerRoutes(app);

export default app;
