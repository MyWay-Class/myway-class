# Frontend AI Chat / Public Home Split Bundle v8

## 범위
- `AIChatPage` 상태/전송 로직을 `useAIChatPageState`로 분리
- `PublicHomePage` 검색/필터/집계 로직을 `usePublicHomePageState`로 분리

## 결과
- `frontend/src/features/lms/pages/AIChatPage.tsx` 63줄
- `frontend/src/features/lms/pages/PublicHomePage.tsx` 126줄
- `frontend/src/features/lms/pages/useAIChatPageState.ts` 163줄
- `frontend/src/features/lms/pages/usePublicHomePageState.ts` 85줄

## 검증
- `npm run build:frontend`
- `npm run verify`

## 비고
- UI 조립 파일은 얇게 유지하고, 데이터 가공과 비동기 요청은 훅으로 이동해 다음 분리의 기준을 낮췄다.
