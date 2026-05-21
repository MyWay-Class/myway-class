# 2026-04-10 관리자 자동화 provider runtime policy 갱신

- issue #125는 관리자 자동화 화면의 provider 안내 문구가 예전 fallback 설명에 머물러 있어서, 현재 runtime policy 기준으로 정리할 필요가 있었다.
- `packages/shared/src/ai/ai-provider.ts`의 provider 설명과 단계 설명을 dev / staging / production 정책에 맞게 바꿨다.
- `frontend/src/features/lms/pages/AdminAutomationPage.tsx`에 runtime policy 요약 카드를 추가해서 운영 모드, AI 로그인, STT, 미디어 업로드 상태를 한눈에 보이게 했다.

## 검증
- `npm run verify` 통과
