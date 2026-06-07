import type { ApiRequestResult } from './api-core';

const ERROR_MESSAGES: Record<string, string> = {
  AI_AUTH_REQUIRED: 'AI 기능은 로그인 후 사용할 수 있습니다.',
  AI_QUOTA_EXCEEDED: '오늘 AI 요청 한도를 초과했습니다.',
  AI_TOTAL_QUOTA_EXCEEDED: '오늘 AI 총 사용 한도를 초과했습니다.',
  AI_GEMINI_QUOTA_EXCEEDED: 'Gemini 일일 사용 한도를 초과했습니다.',
  RATE_LIMIT_EXCEEDED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  STT_DISABLED: '현재 환경에서는 STT 기능이 비활성화되어 있습니다.',
  AI_QUOTA_STORAGE_REQUIRED: '공개 테스트 quota 저장소가 연결되지 않았습니다.',
  HTTP_401: '로그인이 필요합니다.',
  HTTP_403: '현재 권한으로는 사용할 수 없습니다.',
  HTTP_429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  HTTP_503: '서버 준비 상태를 확인해 주세요.',
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAiErrorMessage(response: ApiRequestResult<unknown> | null, fallback = '요청에 실패했습니다.'): string {
  if (!response) {
    return fallback;
  }

  const code = response.error?.code ?? `HTTP_${response.status}`;
  return ERROR_MESSAGES[code] ?? response.error?.message ?? response.message ?? fallback;
}

export function getQuotaStatusText(response: ApiRequestResult<unknown> | null): string | null {
  if (!response) {
    return null;
  }

  const remaining = response.headers.get('x-ai-quota-remaining');
  const reset = response.headers.get('x-ai-quota-reset');

  if (!remaining) {
    return null;
  }

  return reset
    ? `오늘 남은 요청 ${remaining}회 · ${formatDateTime(reset)} 초기화`
    : `오늘 남은 요청 ${remaining}회`;
}

export function getPublicTestPolicyText(kind: 'chat' | 'summary' | 'media'): string {
  if (kind === 'media') {
    return '공개 테스트에서는 로그인 후 3분 이하 STT만 허용됩니다. 영상 업로드와 오디오 추출은 관리자 전용입니다.';
  }

  if (kind === 'summary') {
    return '공개 테스트에서는 로그인 후 요약을 사용할 수 있고, 요청 수가 많으면 잠시 제한될 수 있습니다.';
  }

  return '공개 테스트에서는 로그인 후 AI 채팅을 사용할 수 있고, 일일 quota와 rate limit이 함께 적용됩니다.';
}
