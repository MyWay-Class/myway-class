# 2026-04-13 Login Page Separation

## 변경 요약
- 공용 홈에서 데모 계정 로그인 섹션을 제거했다.
- 공용 홈에는 로그인 유도 버튼만 남기고, 로그인 카드와 데모 계정 선택은 분리했다.
- 홈의 로그인/회원가입 버튼을 누르면 별도 로그인 페이지로 전환되도록 분리했다.
- 로그인 페이지는 데모 계정 선택을 포함한 전용 화면으로 유지했다.

## 영향 범위
- `frontend/src/components/LmsDashboard.tsx`
- `frontend/src/features/lms/components/LoginScreen.tsx`
- `frontend/src/features/lms/pages/PublicHomePage.tsx`
