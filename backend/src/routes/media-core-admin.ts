import { Hono } from 'hono';
import { registerMediaAdminOperationsRoutes } from './media-core-admin-operations';
import { registerMediaAdminObservabilityRoutes } from './media-core-admin-observability';

export function registerMediaAdminRoutes(media: Hono): void {
  registerMediaAdminOperationsRoutes(media);
  registerMediaAdminObservabilityRoutes(media);
}

const media = new Hono();

registerMediaAdminRoutes(media);

export default media;
