export type WorkersAI = {
  run: <TInput extends Record<string, unknown>, TOutput = unknown>(model: string, input: TInput) => Promise<TOutput>;
};

export type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        contentDisposition?: string;
      };
    },
  ) => Promise<unknown>;
  get: (
    key: string,
  ) => Promise<
    | {
        body?: ReadableStream<Uint8Array> | null;
        httpMetadata?: {
          contentType?: string;
          contentDisposition?: string;
        };
      }
    | null
  >;
};

type RuntimeStringKey = Exclude<keyof RuntimeBindings, 'AI' | 'ASSETS'>;

export type RuntimeBindings = {
  APP_ENV?: 'development' | 'staging' | 'production';
  API_ORIGIN?: string;
  AI?: WorkersAI;
  ASSETS?: R2BucketLike;
  MYWAY_OLLAMA_BASE_URL?: string;
  OLLAMA_BASE_URL?: string;
  MYWAY_OLLAMA_MODEL?: string;
  OLLAMA_MODEL?: string;
  MYWAY_GEMINI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  MYWAY_GEMINI_MODEL?: string;
  GEMINI_MODEL?: string;
  MYWAY_GEMINI_BASE_URL?: string;
  GEMINI_BASE_URL?: string;
  MYWAY_CLOUDFLARE_STT_MODEL?: string;
  CLOUDFLARE_STT_MODEL?: string;
  MYWAY_MEDIA_PROCESSOR_URL?: string;
  MEDIA_PROCESSOR_URL?: string;
  MYWAY_MEDIA_PROCESSOR_TOKEN?: string;
  MEDIA_PROCESSOR_TOKEN?: string;
  MYWAY_MEDIA_CALLBACK_SECRET?: string;
  MEDIA_CALLBACK_SECRET?: string;
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

export function getGeminiRuntimeSettings(env?: RuntimeBindings): {
  api_key?: string;
  model?: string;
  base_url: string;
} {
  return {
    api_key: getRuntimeValue(env, 'MYWAY_GEMINI_API_KEY', getRuntimeValue(env, 'GEMINI_API_KEY')),
    model: getRuntimeValue(env, 'MYWAY_GEMINI_MODEL', getRuntimeValue(env, 'GEMINI_MODEL', 'gemini-2.0-flash')),
    base_url:
      getRuntimeValue(
        env,
        'MYWAY_GEMINI_BASE_URL',
        getRuntimeValue(env, 'GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
      ) ?? 'https://generativelanguage.googleapis.com/v1beta',
  };
}

export function getMediaProcessorRuntimeSettings(env?: RuntimeBindings): {
  url?: string;
  token?: string;
  callback_secret?: string;
} {
  return {
    url: getRuntimeValue(env, 'MYWAY_MEDIA_PROCESSOR_URL', getRuntimeValue(env, 'MEDIA_PROCESSOR_URL')),
    token: getRuntimeValue(env, 'MYWAY_MEDIA_PROCESSOR_TOKEN', getRuntimeValue(env, 'MEDIA_PROCESSOR_TOKEN')),
    callback_secret: getRuntimeValue(env, 'MYWAY_MEDIA_CALLBACK_SECRET', getRuntimeValue(env, 'MEDIA_CALLBACK_SECRET')),
  };
}
