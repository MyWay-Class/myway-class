import { Hono } from 'hono';
import { registerCourseCommandRoutes } from './courses-core-command';
import { registerCourseQueryRoutes } from './courses-core-query';

const courses = new Hono();

registerCourseCommandRoutes(courses);
registerCourseQueryRoutes(courses);

export default courses;
