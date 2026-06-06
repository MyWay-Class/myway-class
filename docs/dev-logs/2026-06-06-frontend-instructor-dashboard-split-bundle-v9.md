# Frontend Instructor Dashboard Split Bundle v9

## 범위
- `InstructorDashboardPage`의 계산 로직을 `useInstructorDashboardPageState`로 분리
- 대시보드의 강의 목록, 타임라인, AI 인사이트 렌더를 섹션 컴포넌트로 분리

## 결과
- `frontend/src/features/lms/pages/InstructorDashboardPage.tsx` 59줄
- `frontend/src/features/lms/pages/InstructorDashboardPageSections.tsx` 116줄
- `frontend/src/features/lms/pages/useInstructorDashboardPageState.ts` 70줄
- `frontend/src/features/lms/pages/useLectureWatchPlayback.ts` 195줄

## 검증
- `npm run build:frontend`
- `npm run verify`

## 비고
- 화면 조립 파일은 상태 계산과 긴 JSX를 분리해 유지보수 경계를 좁혔다.
