# 2026-04-13 Premium UI Demo Data

## 변경 요약
- 프론트 premium UI 이식 중, 실제 운영 데이터가 비어도 화면이 살아 있도록 데모 데이터를 추가했다.
- `frontend/src/features/lms/data/demo.ts`에 사용자, 강의, 대시보드, 인사이트, 전사, 미디어 파이프라인용 샘플 레코드를 정리했다.
- `MyCoursesPage`, `AdminDashboardPage`, `AdminUsersPage`, `AdminInstructorsPage`, `AdminAutomationPage`, `LectureStudioPage`, `MediaPipelinePage`가 실데이터가 없을 때 데모 데이터를 폴백으로 사용하도록 맞췄다.

## 검증
- `npm --workspace @myway/frontend run build` 통과

## 메모
- 실제 운영 데이터가 있으면 기존 로직을 우선 사용하고, 비어 있을 때만 데모 데이터가 보이도록 구성했다.
