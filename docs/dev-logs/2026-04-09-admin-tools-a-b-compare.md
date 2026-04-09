# 2026-04-09 admin tools A/B compare

## 변경 요약
- 강사/운영자 화면에 검색, 필터, 정렬, 비교 카드를 추가했다.
- A/B 워킹트리를 비교한 뒤 A안을 선택했다.

## 배경
- `#70`은 운영자가 강의와 수강 흐름을 더 빨리 파악할 수 있도록 탐색성과 비교성을 높이는 작업이다.
- 기존 화면은 통계는 있었지만, 빠른 검색과 역할별 우선순위가 부족했다.

## 변경 내용
- `frontend/src/features/lms/components/AdminFilterBar.tsx`
  - 검색, 정렬, 필터 칩을 공통 바 형태로 분리했다.
- `frontend/src/features/lms/components/ComparisonCardGrid.tsx`
  - 최근 집계와 이전 집계를 비교하는 카드를 분리했다.
- `frontend/src/features/lms/pages/AdminUsersPage.tsx`
  - 이름, 이메일, 소속, 역할 검색과 정렬을 추가했다.
- `frontend/src/features/lms/pages/AdminInstructorsPage.tsx`
  - 강사 검색, 소속 필터, 과목 수 기준 정렬을 추가했다.
- `frontend/src/features/lms/pages/AdminStatsPage.tsx`
  - AI 로그 비교 카드와 운영 비교 요약을 추가했다.
- `frontend/src/features/lms/pages/AdminDashboardPage.tsx`
  - 운영 우선순위가 높은 카드 순서를 먼저 보이도록 정리했다.
- `docs/project/20-status-and-next-steps.md`
  - 운영 도구 고도화가 완료된 상태를 반영했다.

## 연결 이슈
- Closes #70

## 검증
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`

## 코드리뷰
- A안은 기존 페이지를 유지하면서 검색/필터/비교만 얹어서 변경 범위가 작다.
- B안은 전용 운영 허브를 새로 만드는 방식이라 구조는 분명하지만 초기 변경량이 더 크다.

## 체크 사항
- [x] A/B 워킹트리 비교 후 A안 선택
- [x] 검색/필터/정렬 추가
- [x] 비교 카드 추가
- [x] 역할별 우선순위 재정리
- [x] 프론트 타입체크 통과
- [x] 이슈 연결
