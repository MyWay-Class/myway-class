# 2026-04-13 홈 복귀 및 카드 진입 정리

## 변경 요약
- 사이드바 로고 클릭 시 `dashboard`만 유지하지 않고, 선택된 강의/차시 상태를 초기화한 뒤 메인 화면으로 복귀하도록 정리했다.
- `AppShell`/`AppSidebar`에 홈 복귀 핸들을 분리해서 로고 진입점이 명확하도록 바꿨다.
- `CoursesPage`, `MyCoursesPage`, `StudentDashboardPage`의 카드 진입 동작을 상세 화면으로 이어지게 맞췄다.
- 강의 길이는 transcript 또는 추출 결과를 우선 반영하는 공통 헬퍼를 유지해 카드, 타임라인, 숏폼 제작, 업로드 화면에서 같은 값을 쓰도록 정리했다.

## 검증
- `npm --workspace @myway/frontend run build`

