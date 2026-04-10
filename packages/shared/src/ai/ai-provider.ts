export type AIProviderName = 'demo' | 'ollama' | 'gemini' | 'cloudflare';

export type AIProviderCapability =
  | 'intent'
  | 'search'
  | 'answer'
  | 'summary'
  | 'quiz'
  | 'smart'
  | 'insights'
  | 'recommendations'
  | 'stt'
  | 'embedding';

export type AIProviderStatus = 'available' | 'planned' | 'disabled';

export type AIProviderDescriptor = {
  name: AIProviderName;
  label: string;
  description: string;
  status: AIProviderStatus;
  capabilities: AIProviderCapability[];
};

export type AIProviderStep = {
  provider: AIProviderName;
  reason: string;
  status: AIProviderStatus;
};

export type AIProviderPlan = {
  feature: AIProviderCapability;
  current_provider: AIProviderName;
  recommended_chain: AIProviderName[];
  steps: AIProviderStep[];
};

export type AIRuntimePolicy = {
  public_mode: 'dev' | 'free_test';
  require_auth: boolean;
  enable_stt: boolean;
  enable_media_upload: boolean;
  daily_limits: {
    total?: number;
    smart?: number;
    summary?: number;
    quiz?: number;
    stt?: number;
    answer?: number;
    gemini?: number;
  };
};

export type AIProviderCatalog = {
  generated_at: string;
  runtime_policy?: AIRuntimePolicy;
  providers: AIProviderDescriptor[];
  plans: AIProviderPlan[];
};

const PROVIDER_DESCRIPTORS: AIProviderDescriptor[] = [
  {
    name: 'demo',
    label: 'Demo Engine',
    description: '항상 동작하는 내장 안전망으로, 정책이나 네트워크가 막혀도 기본 동작을 보장합니다.',
    status: 'available',
    capabilities: ['intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations', 'stt', 'embedding'],
  },
  {
    name: 'ollama',
    label: 'Ollama',
    description: 'dev 로컬 개발 환경에서 사용하는 모델 계층입니다.',
    status: 'available',
    capabilities: ['intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations', 'embedding'],
  },
  {
    name: 'gemini',
    label: 'Gemini',
    description: 'staging/production에서 텍스트 생성과 분류, 요약을 담당하는 외부 모델 계층입니다.',
    status: 'available',
    capabilities: ['intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations', 'stt'],
  },
  {
    name: 'cloudflare',
    label: 'Cloudflare AI',
    description: '공개 테스트에서 STT 우선 경로로 쓰는 Workers AI 계층입니다.',
    status: 'planned',
    capabilities: ['stt', 'embedding', 'intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations'],
  },
];

const FEATURE_CHAIN: Record<AIProviderCapability, AIProviderName[]> = {
  intent: ['ollama', 'gemini', 'cloudflare', 'demo'],
  search: ['ollama', 'gemini', 'cloudflare', 'demo'],
  answer: ['ollama', 'gemini', 'cloudflare', 'demo'],
  summary: ['ollama', 'gemini', 'cloudflare', 'demo'],
  quiz: ['ollama', 'gemini', 'cloudflare', 'demo'],
  smart: ['ollama', 'gemini', 'cloudflare', 'demo'],
  insights: ['ollama', 'gemini', 'cloudflare', 'demo'],
  recommendations: ['ollama', 'gemini', 'cloudflare', 'demo'],
  stt: ['cloudflare', 'gemini', 'demo'],
  embedding: ['cloudflare', 'ollama', 'demo'],
};

function buildSteps(chain: AIProviderName[]): AIProviderStep[] {
  return chain.map((provider, index) => {
    const descriptor = PROVIDER_DESCRIPTORS.find((item) => item.name === provider);
    const firstProvider = chain[0];
    const reason =
      index === 0
        ? firstProvider === 'ollama'
          ? 'dev 로컬 기본 경로'
          : firstProvider === 'gemini'
            ? 'staging/production 텍스트 기본 경로'
            : firstProvider === 'cloudflare'
              ? '공개 테스트 STT 우선 경로'
              : '이 기능의 기본 경로'
        : index === chain.length - 1
          ? '최후의 안전망'
          : '기본 경로가 실패할 때의 대체 경로';

    return {
      provider,
      status: descriptor?.status ?? 'planned',
      reason,
    };
  });
}

export function getAIProviderCatalog(): AIProviderCatalog {
  return {
    generated_at: new Date().toISOString(),
    providers: PROVIDER_DESCRIPTORS,
    plans: Object.entries(FEATURE_CHAIN).map(([feature, chain]) => ({
      feature: feature as AIProviderCapability,
      current_provider: chain[0],
      recommended_chain: chain,
      steps: buildSteps(chain),
    })),
  };
}

export function getAIProviderPlan(feature: AIProviderCapability): AIProviderPlan {
  const chain = FEATURE_CHAIN[feature];
  return {
    feature,
    current_provider: chain[0],
    recommended_chain: chain,
    steps: buildSteps(chain),
  };
}
