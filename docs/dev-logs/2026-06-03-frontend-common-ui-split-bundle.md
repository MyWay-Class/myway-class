# 2026-06-03 Frontend Common UI Split Bundle

## Summary
- 프론트 공통 UI 컴포넌트를 섹션 단위로 분리했다.
- `CourseCreateCard`, `AppSidebar`, `LectureSideChatPanel`, `MediaUploadWorkspacePanel`의 원본 파일을 얇은 오케스트레이션 컴포넌트로 축소했다.

## Scope
- `frontend/src/features/lms/components/CourseCreateCard.tsx`
- `frontend/src/features/lms/components/CourseCreateCardSections.tsx`
- `frontend/src/features/lms/components/AppSidebar.tsx`
- `frontend/src/features/lms/components/AppSidebarSections.tsx`
- `frontend/src/features/lms/components/LectureSideChatPanel.tsx`
- `frontend/src/features/lms/components/LectureSideChatPanelSections.tsx`
- `frontend/src/features/lms/components/media-pipeline/MediaUploadWorkspacePanel.tsx`
- `frontend/src/features/lms/components/media-pipeline/MediaUploadWorkspacePanelSections.tsx`

## Validation
- `npm run verify` 통과

## Notes
- 기존 동작과 props 계약은 유지했다.
- 렌더 블록만 분리하고 상태/이벤트 핸들러는 원본 컴포넌트에 남겼다.
