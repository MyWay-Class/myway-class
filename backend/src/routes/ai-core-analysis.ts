import { Hono } from 'hono';
import { registerAiIntentSearchRoutes } from './ai-core-intent-search';
import { registerAiAnswerRoutes } from './ai-core-answer';

const ai = new Hono();

registerAiIntentSearchRoutes(ai);
registerAiAnswerRoutes(ai);

export default ai;
