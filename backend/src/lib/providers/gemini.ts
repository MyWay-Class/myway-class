import type { RuntimeBindings } from '../runtime-env';
import { getGeminiRuntimeSettings } from '../runtime-env';
import type { OllamaChatMessage } from './ollama';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function toGeminiRole(role: OllamaChatMessage['role']): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

function extractText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const response = payload as GeminiGenerateContentResponse;
  const text = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();

  return text ? text : null;
}

export async function runGeminiJsonPrompt(
  messages: OllamaChatMessage[],
  env?: RuntimeBindings,
  options?: {
    model?: string;
    temperature?: number;
    timeoutMs?: number;
  },
): Promise<string | null> {
  const settings = getGeminiRuntimeSettings(env);
  if (!settings.api_key || !settings.model) {
    return null;
  }

  const timeoutMs = options?.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const systemInstruction = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n');

  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: toGeminiRole(message.role),
      parts: [{ text: message.content }],
    }));

  try {
    const response = await fetch(
      `${trimTrailingSlash(settings.base_url)}/models/${encodeURIComponent(options?.model ?? settings.model)}:generateContent?key=${encodeURIComponent(settings.api_key)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          ...(systemInstruction
            ? {
                systemInstruction: {
                  parts: [{ text: systemInstruction }],
                },
              }
            : {}),
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    return extractText(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
