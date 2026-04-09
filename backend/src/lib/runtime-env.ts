export type WorkersAI = {
  run: <TInput extends Record<string, unknown>, TOutput = unknown>(model: string, input: TInput) => Promise<TOutput>;
};

type RuntimeStringKey = Exclude<keyof RuntimeBindings, 'AI'>;

export type RuntimeBindings = {
  APP_ENV?: 'development' | 'staging' | 'production';
  API_ORIGIN?: string;
  AI?: WorkersAI;
  MYWAY_OLLAMA_BASE_URL?: string;
  OLLAMA_BASE_URL?: string;
  MYWAY_OLLAMA_MODEL?: string;
  OLLAMA_MODEL?: string;
  MYWAY_CLOUDFLARE_STT_MODEL?: string;
  CLOUDFLARE_STT_MODEL?: string;
};

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getRuntimeValue(
  env: RuntimeBindings | undefined,
  key: RuntimeStringKey,
  fallback?: string,
): string | undefined {
  return normalize(env?.[key]) ?? fallback;
}

export function getOllamaRuntimeSettings(env?: RuntimeBindings): {
  base_url: string;
  model: string;
} {
  return {
    base_url: getRuntimeValue(env, 'MYWAY_OLLAMA_BASE_URL', getRuntimeValue(env, 'OLLAMA_BASE_URL', 'http://127.0.0.1:11434')) ?? 'http://127.0.0.1:11434',
    model: getRuntimeValue(env, 'MYWAY_OLLAMA_MODEL', getRuntimeValue(env, 'OLLAMA_MODEL', 'llama3.1')) ?? 'llama3.1',
  };
}

export function getCloudflareSTTRuntimeSettings(env?: RuntimeBindings): {
  model: string;
} {
  return {
    model:
      getRuntimeValue(
        env,
        'MYWAY_CLOUDFLARE_STT_MODEL',
        getRuntimeValue(env, 'CLOUDFLARE_STT_MODEL', '@cf/openai/whisper-large-v3-turbo'),
      ) ?? '@cf/openai/whisper-large-v3-turbo',
  };
}
