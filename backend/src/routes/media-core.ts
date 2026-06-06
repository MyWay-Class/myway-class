import { Hono } from 'hono';
import { registerMediaAdminRoutes } from './media-core-admin';
import { registerMediaPublicRoutes } from './media-core-public';

const media = new Hono();

registerMediaAdminRoutes(media);
registerMediaPublicRoutes(media);

export default media;
