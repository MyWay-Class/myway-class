import type { Hono } from 'hono';
import auth from './auth';
import customCourses from './custom-courses';
import aiInsights from './ai-insights';
import ai from './ai';
import courses from './courses';
import dashboard from './dashboard';
import enrollments from './enrollments';
import health from './health';
import media from './media';
import lectures from './lectures';
import smart from './smart';
import shortform from './shortform';

export function registerRoutes(app: Hono): void {
  app.route('/api/v1/health', health);
  app.route('/api/v1/auth', auth);
  app.route('/api/v1/ai/insights', aiInsights);
  app.route('/api/v1/ai', ai);
  app.route('/api/v1/custom-courses', customCourses);
  app.route('/api/v1/dashboard', dashboard);
  app.route('/api/v1/courses', courses);
  app.route('/api/v1/lectures', lectures);
  app.route('/api/v1/media', media);
  app.route('/api/v1/smart', smart);
  app.route('/api/v1/shortform', shortform);
  app.route('/api/v1/enrollments', enrollments);
}
