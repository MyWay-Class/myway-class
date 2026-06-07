# 2026-04-13 Sidebar Theme Watch Navigation AB

## Issue
- #166 [사이드바/테마/내 강의/영상 시청 UX 정리](https://github.com/MyWay-Class/myway-class/issues/166)

## 변경 요약
- 사이드바 접기/펼치기, 좌우 도킹 선택, 다크/라이트 테마 전환을 공용 쉘에 넣었다.
- 로고 클릭 시 대시보드로 복귀하도록 연결했다.
- `대시보드 / 내 강의` 중심 내비게이션으로 재구성했다.
- `내 강의 -> 상세/진도율 -> 차시 시청` 흐름을 분리하고, 시청 화면 우측 패널에 `차시 목록 / 카테고리 / 챗봇` 탭을 넣었다.
- 레퍼런스 이미지에 맞게 카드형 목록과 시청 레이아웃을 정리했다.

## 선택 이유
- B를 메인으로 선택했다.
- B는 영상 시청 화면의 우측 탭 전환과 차시 탐색 흐름이 더 직접적으로 드러나서, 사용자가 지금 무엇을 보고 무엇을 눌러야 하는지 읽기 쉽다.
- 홈에서 내 강의, 상세/진도율, 시청으로 이어지는 정보 구조가 레퍼런스 이미지의 탐색 중심 패턴과 더 잘 맞는다.
- 사이드바와 테마 전환 같은 공용 조작도 시청 흐름과 한 화면에서 자연스럽게 연결되어, 전체 UX가 한 덩어리로 보인다.

## 검증
- `npm install`
- `npm --workspace @myway/frontend run build`

## 영향 범위
- `frontend/src/components/LmsDashboard.tsx`
- `frontend/src/features/lms/components/AppHeader.tsx`
- `frontend/src/features/lms/components/AppShell.tsx`
- `frontend/src/features/lms/components/AppSidebar.tsx`
- `frontend/src/features/lms/config.ts`
- `frontend/src/features/lms/pages/LectureWatchPage.tsx`
- `frontend/src/features/lms/pages/MyCoursesPage.tsx`
- `frontend/src/features/lms/pages/RolePageRouter.tsx`
- `frontend/src/features/lms/types.ts`
- `frontend/src/styles.css`
- `frontend/tailwind.config.ts`
