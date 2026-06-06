import { Hono } from 'hono';
import { registerAiAnalysisRoutes } from './ai-core-analysis';
import { registerAiGenerationRoutes } from './ai-core-generation';

const ai = new Hono();

registerAiAnalysisRoutes(ai);
registerAiGenerationRoutes(ai);

export default ai;
