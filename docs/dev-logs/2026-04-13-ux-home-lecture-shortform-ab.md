# 2026-04-13 UX Home Lecture Shortform AB

## 변경 요약
- 홈 화면을 탐색 허브 형태로 재구성했다.
- 강의 상세와 강의 시청 페이지를 분리하고 `lecture-watch` 경로를 추가했다.
- 숏폼 제작 화면에 단계 요약, 고정 사이드바, 진행 맥락을 보강했다.

## 검증
- `npm --workspace @myway/frontend run build`

## 선택 이유
- 숏폼 제작 흐름에 단계 안내와 고정 요약이 더 잘 드러나고, 사용자가 현재 위치와 다음 행동을 더 쉽게 이해할 수 있다.
- 홈과 강의 시청 분리도 유지하면서, 전체적으로 작업 맥락을 잃지 않도록 구성된 쪽이 B였다.

## 영향 범위
- `frontend/src/features/lms/pages/PublicHomePage.tsx`
- `frontend/src/features/lms/components/CourseExploreDetailPanel.tsx`
- `frontend/src/features/lms/pages/LectureWatchPage.tsx`
- `frontend/src/features/lms/pages/RolePageRouter.tsx`
- `frontend/src/features/lms/pages/CoursesPage.tsx`
- `frontend/src/features/lms/config.ts`
- `frontend/src/features/lms/types.ts`
- `frontend/src/features/lms/components/ShortformWizard.tsx`
- `frontend/src/features/lms/components/ShortformWizardSidebar.tsx`
- `frontend/src/features/lms/components/ShortformWizardStep2.tsx`
- `frontend/src/features/lms/components/ShortformWizardStep3.tsx`
