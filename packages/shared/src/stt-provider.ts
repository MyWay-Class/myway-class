export type STTProviderName = 'demo' | 'cloudflare' | 'gemini';

export type STTProviderCapability = 'transcribe' | 'segment' | 'pipeline';

export type STTProviderStatus = 'available' | 'planned' | 'disabled';

export type STTProviderDescriptor = {
  name: STTProviderName;
  label: string;
  description: string;
  status: STTProviderStatus;
  capabilities: STTProviderCapability[];
};

export type STTProviderStep = {
  provider: STTProviderName;
  reason: string;
  status: STTProviderStatus;
};

export type STTProviderPlan = {
  feature: STTProviderCapability;
  current_provider: STTProviderName;
  recommended_chain: STTProviderName[];
  steps: STTProviderStep[];
};

export type STTProviderCatalog = {
  generated_at: string;
  providers: STTProviderDescriptor[];
  plans: STTProviderPlan[];
};

const PROVIDERS: STTProviderDescriptor[] = [
  {
    name: 'demo',
    label: 'Demo STT',
    description: '현재 텍스트 기반 트랜스크립트를 안전하게 유지하는 기본 경로입니다.',
    status: 'available',
    capabilities: ['transcribe', 'segment', 'pipeline'],
  },
  {
    name: 'cloudflare',
    label: 'Cloudflare AI',
    description: '배포 환경에서 안정적으로 붙일 수 있는 STT 및 파이프라인 계층입니다.',
    status: 'planned',
    capabilities: ['transcribe', 'segment', 'pipeline'],
  },
  {
    name: 'gemini',
    label: 'Gemini',
    description: '무료 API 쿼터 기반으로 전사 보조와 정리 작업에 활용할 수 있습니다.',
    status: 'planned',
    capabilities: ['transcribe', 'segment', 'pipeline'],
  },
];

const FEATURE_CHAIN: Record<STTProviderCapability, STTProviderName[]> = {
  transcribe: ['cloudflare', 'gemini', 'demo'],
  segment: ['cloudflare', 'gemini', 'demo'],
  pipeline: ['cloudflare', 'gemini', 'demo'],
};

function buildSteps(chain: STTProviderName[]): STTProviderStep[] {
  return chain.map((provider, index) => {
    const descriptor = PROVIDERS.find((item) => item.name === provider);

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

export function getSTTProviderCatalog(): STTProviderCatalog {
  return {
    generated_at: new Date().toISOString(),
    providers: PROVIDERS,
    plans: Object.entries(FEATURE_CHAIN).map(([feature, chain]) => ({
      feature: feature as STTProviderCapability,
      current_provider: chain[0],
      recommended_chain: chain,
      steps: buildSteps(chain),
    })),
  };
}

export function getSTTProviderPlan(feature: STTProviderCapability): STTProviderPlan {
  const chain = FEATURE_CHAIN[feature];

  return {
    feature,
    current_provider: chain[0],
    recommended_chain: chain,
    steps: buildSteps(chain),
  };
}
