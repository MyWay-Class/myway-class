import { Hono } from 'hono';
import { registerAiIntentSearchRoutes } from './ai-core-intent-search';
import { registerAiAnswerRoutes } from './ai-core-answer';

export function registerAiAnalysisRoutes(ai: Hono): void {
  registerAiIntentSearchRoutes(ai);
  registerAiAnswerRoutes(ai);
}

const ai = new Hono();

registerAiAnalysisRoutes(ai);

export default ai;
