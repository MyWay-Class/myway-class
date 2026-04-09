import type { RuntimeBindings } from '../runtime-env';

export type OllamaChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OllamaChatResponse = {
  message?: {
    role?: string;
    content?: string;
  };
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function extractChatContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const response = payload as OllamaChatResponse;
  const content = response.message?.content?.trim();

  return content ? content : null;
}

export async function runOllamaChat(
  messages: OllamaChatMessage[],
  env?: RuntimeBindings,
  options?: {
    model?: string;
    temperature?: number;
    timeoutMs?: number;
  },
): Promise<string | null> {
  const baseUrl = env?.MYWAY_OLLAMA_BASE_URL ?? env?.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
  const model = options?.model ?? env?.MYWAY_OLLAMA_MODEL ?? env?.OLLAMA_MODEL ?? 'llama3.1';
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${trimTrailingSlash(baseUrl)}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.2,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    return extractChatContent(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
