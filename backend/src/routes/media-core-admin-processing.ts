import { Hono } from 'hono';
import { registerMediaAdminProcessingUploadRoutes } from './media-core-admin-processing-upload';
import { registerMediaAdminProcessingAIMRoutes } from './media-core-admin-processing-ai';

export function registerMediaAdminProcessingRoutes(media: Hono): void {
  registerMediaAdminProcessingUploadRoutes(media);
  registerMediaAdminProcessingAIMRoutes(media);
}

const media = new Hono();

registerMediaAdminProcessingRoutes(media);

export default media;
