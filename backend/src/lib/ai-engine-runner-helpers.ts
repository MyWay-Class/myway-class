import type { AIProviderName } from '@myway/shared';
import type { RuntimeBindings } from './runtime-env';
import { getGeminiModel, getOllamaModel } from './ai-engine-utils';
import { runGeminiJsonPrompt, runOllamaChat } from './providers';

export async function runProviderFallbackChain(
  fallbackChain: AIProviderName[],
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  timeoutMs: number,
  env?: RuntimeBindings,
  temperature?: number,
): Promise<{ response: string | null; provider: AIProviderName | null }> {
  let response: string | null = null;
  let responseProvider: AIProviderName | null = null;

  for (const provider of fallbackChain) {
    if (provider === 'ollama') {
      response = await runOllamaChat(messages, env, {
        model: getOllamaModel(env),
        temperature,
        timeoutMs,
      });
      responseProvider = response ? 'ollama' : null;
    }

    if (!response && provider === 'gemini') {
      response = await runGeminiJsonPrompt(messages, env, {
        model: getGeminiModel(env),
        timeoutMs,
      });
      responseProvider = response ? 'gemini' : responseProvider;
    }

    if (response) {
      break;
    }
  }

  return { response, provider: responseProvider };
}
