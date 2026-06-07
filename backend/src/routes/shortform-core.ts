import { Hono } from 'hono';
import { registerShortformLibraryRoutes } from './shortform-core-library';
import { registerShortformProcessingRoutes } from './shortform-core-processing';

const shortform = new Hono();

registerShortformProcessingRoutes(shortform);
registerShortformLibraryRoutes(shortform);

export default shortform;
