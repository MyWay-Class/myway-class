# Dashboard UX A/B Compare

## Context
- Issue #69 requested smoother dashboard and detail UX, especially for mobile, empty, loading, and error-like states.
- The existing frontend already had a `loading` prop and `apiStatus` contract, but the shell and detail pages did not surface them well.

## A안
- Add a small shared `StatePanel` component.
- Hide the persistent sidebar on mobile and let the main content breathe with responsive padding.
- Surface initial loading as a dedicated full-page state.
- Show an offline banner when the API status is not healthy.
- Add empty/selection guidance cards to the course and lecture detail panels.

## B안
- Rework each dashboard page separately with larger page-specific layouts.
- Add richer mobile navigation and more bespoke empty states per page.
- This would touch more files and make the first UX pass harder to verify.

## Decision
- A안을 선택했다.
- 이유는 shared shell과 shared state panel만 추가해도 dashboard, course detail, and loading/offline handling을 동시에 개선할 수 있기 때문이다.
- 변경 파일 수가 적고, 기존 화면 구조를 유지한 채 사용자 체감만 바로 올릴 수 있다.

## Validation
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit` 통과

## Follow-up
- `docs/project/20-status-and-next-steps.md`
