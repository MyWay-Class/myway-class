# 공통 개요

## 목적
백엔드에서 여러 도메인이 공유하는 규칙을 정리한다.

## 공통 응답 예시
```ts
// 실제 타입 원본은 packages/shared/src/index.ts에 둔다.
// 아래는 참조용 복사이며, 원본과 항상 일치해야 한다.
type ApiError = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
};
```

## 공통 규칙
- 에러는 짧고 명확하게 반환한다.
- 구조화된 AI 출력은 정규화해서 내려준다.
- 공통 타입은 `packages/shared`와 항상 일치해야 한다.
