# 2026-04-08 AI 추천과 사용자 설정

## 변경 이유
- 학생, 강사, 운영자별로 다음에 볼 과목과 기본 선호를 분리해서 보여줄 필요가 있었다.
- 기존 `AI 인사이트`와 달리, 추천 목록과 사용자 설정은 학습 흐름에 직접 붙는 개인화 기능이라 별도 영역이 필요했다.

## 변경 내용
- `GET /api/v1/ai/recommendations`, `GET /api/v1/ai/settings`, `PUT /api/v1/ai/settings`를 추가했다.
- `packages/shared/src/ai-recommendations.ts`에서 역할별 추천 목록과 기본 설정을 계산하도록 만들었다.
- `frontend/src/components/dashboard/AIRecommendationsPanel.tsx`를 추가해 추천 카드와 설정 폼을 한 화면에 붙였다.
- `frontend/src/lib/api.ts`, `frontend/src/lib/app-state.ts`, `frontend/src/App.tsx`, `frontend/src/components/LmsDashboard.tsx`, `frontend/src/styles.css`를 연결했다.

## 비교 메모
- 이번 작업은 단일 워킹트리에서 바로 구현했고, 별도 2안 워킹트리 비교는 하지 않았다.
- 이유는 새 라우트, 새 패널, shared type 확장이 함께 필요한 구조라서, 파일 분리를 본 뒤 바로 구현으로 들어가는 편이 더 빨랐기 때문이다.

## 검증
- `npm --workspace @myway/frontend run build` 통과
- `npm --workspace @myway/backend run build` 통과
