type RuntimeLike = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

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

function readRuntimeEnv(key: string): string | undefined {
  const runtime = globalThis as RuntimeLike;
  return runtime.process?.env?.[key];
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getOllamaBaseUrl(): string {
  return (
    readRuntimeEnv('MYWAY_OLLAMA_BASE_URL') ??
    readRuntimeEnv('OLLAMA_BASE_URL') ??
    'http://127.0.0.1:11434'
  );
}

function getOllamaModel(): string {
  return readRuntimeEnv('MYWAY_OLLAMA_MODEL') ?? readRuntimeEnv('OLLAMA_MODEL') ?? 'llama3.1';
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
  options?: {
    model?: string;
    temperature?: number;
  },
): Promise<string | null> {
  const response = await fetch(`${trimTrailingSlash(getOllamaBaseUrl())}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model ?? getOllamaModel(),
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
}
