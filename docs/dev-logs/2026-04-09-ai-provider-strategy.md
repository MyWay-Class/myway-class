# AI Provider Strategy

## 배경
- 이슈 #42에서는 AI 기능을 실제 엔진에 붙이기 전에 provider 계층과 fallback 전략을 먼저 정리했다.
- 현재 구현은 demo 기반이지만, 향후 Ollama, Gemini, Cloudflare AI를 섞어 쓸 수 있어야 한다.

## 변경 내용
- `packages/shared/src/ai-provider.ts`를 추가해 provider 이름, 기능 범위, fallback 순서를 공통 타입으로 정리했다.
- `backend/src/lib/ai-provider.ts`와 `backend/src/routes/ai-providers.ts`를 추가해 provider 카탈로그를 API로 조회할 수 있게 했다.
- `frontend/src/lib/api.ts`, `frontend/src/lib/app-state.ts`, `frontend/src/components/LmsDashboard.tsx`, `frontend/src/features/lms/pages/AdminAutomationPage.tsx`를 연결해 운영자 화면에서 provider 계층을 볼 수 있게 했다.
- `docs/project/14-ai-layer.md`, `docs/project/15-api-map.md`에 provider 계층과 `GET /api/v1/ai/providers`를 반영했다.

## 검증 포인트
- provider 계층은 `Ollama -> Gemini -> Cloudflare AI -> demo`를 기본 fallback으로 둔다.
- `STT`와 `embedding`은 Cloudflare AI 우선, 텍스트 생성 계열은 Ollama 우선으로 정리했다.
- 운영자 자동화 화면에서 provider 우선순위와 fallback 순서를 확인할 수 있다.
