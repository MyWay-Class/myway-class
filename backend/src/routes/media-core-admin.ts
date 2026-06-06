import { Hono } from 'hono';
import { registerMediaAdminOperationsRoutes } from './media-core-admin-operations';
import { registerMediaAdminObservabilityRoutes } from './media-core-admin-observability';

const media = new Hono();

registerMediaAdminOperationsRoutes(media);
registerMediaAdminObservabilityRoutes(media);

export default media;
