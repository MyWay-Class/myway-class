import type { D1Database } from '@cloudflare/workers-types';

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

type RuntimeStringKey = Exclude<keyof RuntimeBindings, 'AI' | 'ASSETS' | 'DB' | 'MEDIA_DB'>;

export type RuntimeBindings = {
  APP_ENV?: 'development' | 'staging' | 'production';
  API_ORIGIN?: string;
  AI?: WorkersAI;
  DB?: D1Database;
  MEDIA_DB?: D1Database;
  ASSETS?: R2BucketLike;
  MYWAY_AI_PUBLIC_MODE?: 'dev' | 'free_test';
  MYWAY_AI_REQUIRE_AUTH?: string;
  MYWAY_AI_ENABLE_STT?: string;
  MYWAY_AI_ENABLE_MEDIA_UPLOAD?: string;
  MYWAY_AI_DAILY_LIMIT_SMART?: string;
  MYWAY_AI_DAILY_LIMIT_SUMMARY?: string;
  MYWAY_AI_DAILY_LIMIT_QUIZ?: string;
  MYWAY_AI_DAILY_LIMIT_STT?: string;
  MYWAY_AI_DAILY_LIMIT_ANSWER?: string;
  MYWAY_AI_DAILY_LIMIT_GEMINI?: string;
  MYWAY_AI_DAILY_LIMIT_TOTAL?: string;
  MYWAY_AI_DAILY_LIMIT_STUDENT?: string;
  MYWAY_AI_DAILY_LIMIT_INSTRUCTOR?: string;
  MYWAY_AI_DAILY_LIMIT_ADMIN?: string;
  MYWAY_AI_QUOTA_WEIGHT_INTENT?: string;
  MYWAY_AI_QUOTA_WEIGHT_SEARCH?: string;
  MYWAY_AI_QUOTA_WEIGHT_ANSWER?: string;
  MYWAY_AI_QUOTA_WEIGHT_SUMMARY?: string;
  MYWAY_AI_QUOTA_WEIGHT_QUIZ?: string;
  MYWAY_AI_QUOTA_WEIGHT_SMART?: string;
  MYWAY_AI_QUOTA_WEIGHT_STT?: string;
  MYWAY_AI_QUOTA_WEIGHT_RAG?: string;
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

export function getAIRuntimePolicy(env?: RuntimeBindings): {
  public_mode: 'dev' | 'free_test';
  require_auth: boolean;
  enable_stt: boolean;
  enable_media_upload: boolean;
  role_limits?: {
    student?: number;
    instructor?: number;
    admin?: number;
  };
  feature_weights?: {
    intent?: number;
    search?: number;
    answer?: number;
    summary?: number;
    quiz?: number;
    smart?: number;
    stt?: number;
    rag?: number;
  };
  daily_limits: {
    total?: number;
    smart?: number;
    summary?: number;
    quiz?: number;
    stt?: number;
    answer?: number;
    gemini?: number;
  };
} {
  const parseLimit = (value: string | undefined): number | undefined => {
    if (!value) {
      return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const parseWeight = (value: string | undefined): number | undefined => {
    if (!value) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  return {
    public_mode: env?.MYWAY_AI_PUBLIC_MODE ?? 'dev',
    require_auth: (env?.MYWAY_AI_REQUIRE_AUTH ?? 'false') === 'true',
    enable_stt: (env?.MYWAY_AI_ENABLE_STT ?? 'true') === 'true',
    enable_media_upload: (env?.MYWAY_AI_ENABLE_MEDIA_UPLOAD ?? 'true') === 'true',
    role_limits: {
      student: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_STUDENT),
      instructor: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_INSTRUCTOR),
      admin: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_ADMIN),
    },
    feature_weights: {
      intent: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_INTENT),
      search: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_SEARCH),
      answer: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_ANSWER),
      summary: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_SUMMARY),
      quiz: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_QUIZ),
      smart: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_SMART),
      stt: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_STT),
      rag: parseWeight(env?.MYWAY_AI_QUOTA_WEIGHT_RAG),
    },
    daily_limits: {
      smart: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_SMART),
      summary: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_SUMMARY),
      quiz: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_QUIZ),
      stt: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_STT),
      answer: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_ANSWER),
      gemini: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_GEMINI),
      total: parseLimit(env?.MYWAY_AI_DAILY_LIMIT_TOTAL),
    },
  };
}
