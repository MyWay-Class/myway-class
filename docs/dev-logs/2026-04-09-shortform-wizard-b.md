# Shortform wizard overhaul

**날짜**: 2026-04-09  
**관련 이슈**: #86  
**브랜치**: `feat/86-shortform-wizard-b`

## 변경 요약
- 숏폼 제작 화면을 레퍼런스 v0.4.0처럼 3단계 위자드로 재구성했다.
- 강좌 선택, 차시별 구간 선택, 미리보기/저장을 분리해서 흐름을 더 명확하게 만들었다.
- 선택 구간 요약과 총 시간 계산, 커뮤니티 미리보기를 함께 배치했다.

## 왜 B안을 선택했는가
- 레퍼런스의 핵심은 단순한 한 화면 편집이 아니라, 단계가 분리된 제작 흐름이었다.
- B안은 `ShortformWizard`를 별도 컴포넌트로 뺀 덕분에, step indicator / clip selector / preview card를 reference처럼 나눠 담을 수 있었다.
- 현재 프로젝트의 custom course API를 유지하면서도, 화면 구조는 레퍼런스와 최대한 맞출 수 있었다.

## 바뀐 파일
- `frontend/src/features/lms/pages/ShortformPage.tsx`
- `frontend/src/features/lms/components/ShortformWizard.tsx`
- `docs/project/16-custom-course-composer.md`
- `docs/project/20-status-and-next-steps.md`

## 확인 포인트
- Step 1: 강좌 선택 카드
- Step 2: 차시 필터 + 추천 구간 선택
- Step 3: 미리보기 카드 + 제목/설명 + 저장
- 선택 클립은 삭제 가능하고, 총 재생 시간이 계산된다.
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`로 타입체크를 통과했다.
