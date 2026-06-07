# 2026-04-10 provider catalog runtime-aware fallback

- issue #126는 provider catalog가 API 실패 시 정적 fallback으로 내려가서 실제 runtime policy와 설명이 어긋날 수 있다는 문제를 다룬다.
- `packages/shared/src/ai/ai-provider.ts`에서 provider catalog와 plan 생성이 runtime policy를 받아 동적으로 조합되도록 바꿨다.
- `frontend/src/lib/api-dashboard.ts`는 성공 응답을 캐시하고, 실패 시 마지막으로 확인한 runtime policy 기준으로 provider catalog를 다시 만들어 보여주도록 정리했다.

## 검증
- `npm run verify` 통과
