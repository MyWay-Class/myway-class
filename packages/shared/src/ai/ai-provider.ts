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

export type AIProviderCatalog = {
  generated_at: string;
  providers: AIProviderDescriptor[];
  plans: AIProviderPlan[];
};

const PROVIDER_DESCRIPTORS: AIProviderDescriptor[] = [
  {
    name: 'demo',
    label: 'Demo Engine',
    description: '현재 앱의 기본 동작을 보장하는 내장 데모 엔진입니다.',
    status: 'available',
    capabilities: ['intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations', 'stt', 'embedding'],
  },
  {
    name: 'ollama',
    label: 'Ollama',
    description: '로컬 또는 자가 호스팅 환경에서 무료로 사용할 수 있는 모델 계층입니다.',
    status: 'planned',
    capabilities: ['intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations', 'embedding'],
  },
  {
    name: 'gemini',
    label: 'Gemini',
    description: '무료 API 쿼터 기반으로 생성, 분류, 요약 보강에 활용할 수 있는 외부 모델 계층입니다.',
    status: 'planned',
    capabilities: ['intent', 'search', 'answer', 'summary', 'quiz', 'smart', 'insights', 'recommendations', 'stt'],
  },
  {
    name: 'cloudflare',
    label: 'Cloudflare AI',
    description: 'Workers AI와 연계해 배포 환경에서 안정적으로 붙일 수 있는 인프라 계층입니다.',
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

    return {
      provider,
      status: descriptor?.status ?? 'planned',
      reason:
        index === 0
          ? '이 기능의 기본 경로'
          : index === chain.length - 1
            ? '최후의 안전망'
            : '기본 경로가 실패할 때의 대체 경로',
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
