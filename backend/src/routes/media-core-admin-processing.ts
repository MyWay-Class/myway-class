import { Hono } from 'hono';
import { registerMediaAdminProcessingUploadRoutes } from './media-core-admin-processing-upload';
import { registerMediaAdminProcessingAIMRoutes } from './media-core-admin-processing-ai';

const media = new Hono();

registerMediaAdminProcessingUploadRoutes(media);
registerMediaAdminProcessingAIMRoutes(media);

export default media;
