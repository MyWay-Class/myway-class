import { Hono } from 'hono';
import { registerMediaAdminProcessingRoutes } from './media-core-admin-processing';
import { registerMediaAdminCallbackRoutes } from './media-core-admin-callback';

export function registerMediaAdminOperationsRoutes(media: Hono): void {
  registerMediaAdminProcessingRoutes(media);
  registerMediaAdminCallbackRoutes(media);
}

const media = new Hono();

registerMediaAdminOperationsRoutes(media);

export default media;
