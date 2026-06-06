import { Hono } from 'hono';
import { registerMediaAdminProcessingRoutes } from './media-core-admin-processing';
import { registerMediaAdminCallbackRoutes } from './media-core-admin-callback';

const media = new Hono();

registerMediaAdminProcessingRoutes(media);
registerMediaAdminCallbackRoutes(media);

export default media;
