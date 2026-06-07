# 2026-04-13 Public Home and Login Flow

## 변경 요약
- 비로그인 상태를 전체 화면 로그인 카드 대신 공용 랜딩 홈으로 전환했다.
- 홈 상단에 브랜드, 로그인/회원가입 버튼, 학습 탐색 CTA를 배치했다.
- 로그인 후 첫 진입 페이지를 역할과 무관하게 `홈`으로 통일했다.
- 홈에서 강의 탐색, 추천 강의, 데모 계정 로그인 흐름을 한 화면에 연결했다.

## 영향 범위
- `frontend/src/components/LmsDashboard.tsx`
- `frontend/src/features/lms/config.ts`
- `frontend/src/features/lms/pages/PublicHomePage.tsx`
