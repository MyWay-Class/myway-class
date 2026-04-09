# Admin users responsive layout

**날짜**: 2026-04-09  
**관련 이슈**: #82  
**브랜치**: `fix/82-admin-users-responsive-b`

## 변경 요약
- 관리자 회원관리 화면을 레퍼런스 v0.4.0처럼 데스크톱 테이블과 모바일 카드로 완전히 분리했다.
- 역할 배지는 레퍼런스의 강조 톤을 따라 운영자, 강사, 학습자별로 색을 나눴다.
- 검색/필터보다 정보 밀도와 화면 전환감이 더 중요한 화면이라, 구조를 단순하게 맞췄다.

## 왜 B안을 선택했는가
- 레퍼런스는 회원 관리에서 필터 중심이 아니라, 화면 크기에 따라 `table -> card`로 자연스럽게 전환되는 구조였다.
- B안은 디자인 기준을 가장 직접적으로 반영할 수 있어서, 우리 프로젝트의 기술 스택 안에서 reference fidelity가 가장 높았다.
- 검색/정렬이 먼저 들어간 구조는 유용하지만, 이번 이슈의 핵심인 반응형 레이아웃을 흐릴 수 있어서 제외했다.

## 바뀐 파일
- `frontend/src/features/lms/pages/AdminUsersPage.tsx`
- `docs/project/20-status-and-next-steps.md`

## 확인 포인트
- 데스크톱에서는 테이블 헤더가 보이고 행 hover 효과가 적용된다.
- 모바일에서는 카드 형태로만 노출되어 작은 화면에서 읽기 쉬워진다.
- 역할은 `ADMIN`, `INSTRUCTOR`, `STUDENT`에 따라 배지 색을 분리했다.
- 타입체크는 `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`로 통과했다.
