import { Hono } from 'hono';
import { getDashboard } from '@myway/shared';
import { jsonSuccess } from '../lib/http';

const dashboard = new Hono();

dashboard.get('/', (c) => {
  const userId = c.req.query('userId') ?? 'usr_std_001';
  return jsonSuccess(getDashboard(userId));
});

export default dashboard;
