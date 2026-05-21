# LMS menu aliases update

**날짜**: 2026-04-09
**관련 이슈**: #88
**브랜치**: `fix/lms-menu-aliases`

## 변경 요약
- 권한별 사이드바 항목에 aliases 개념을 추가했다.
- `courses`, `shortform`, `admin-users` 메뉴가 하위 맥락에서도 활성 표시될 수 있도록 준비했다.
- `LmsDashboard`에서 현재 화면 상태를 반영하는 `activeNavKey`를 분리했다.

## 왜 필요한가
- 레퍼런스처럼 하위 페이지에서도 상위 메뉴가 자연스럽게 활성화되어야 한다.
- 향후 강의 시청, 숏폼 위자드, 관리자 상세 화면 같은 서브 플로우를 붙일 때 메뉴 기준을 다시 만들지 않도록 하려는 목적이다.

## 바뀐 파일
- `frontend/src/features/lms/types.ts`
- `frontend/src/features/lms/config.ts`
- `frontend/src/features/lms/components/AppSidebar.tsx`
- `frontend/src/features/lms/components/AppShell.tsx`
- `frontend/src/components/LmsDashboard.tsx`

## 확인 포인트
- 메뉴 활성화 판정이 공통 helper로 정리됐다.
- `courses` 메뉴는 강의 상세/시청 맥락을 alias로 흡수할 수 있다.
- 구조만 바뀐 것이 아니라, 실제 sidebar가 `activeNavKey`를 사용하도록 연결됐다.
