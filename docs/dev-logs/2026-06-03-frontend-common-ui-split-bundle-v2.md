# 2026-06-03 Frontend Common UI Split Bundle v2

## Summary
- 프론트 공통 UI와 대형 섹션 컴포넌트를 추가로 분리했다.
- 기존 원본 컴포넌트는 조립기 역할만 남기고, 렌더 블록은 섹션 파일로 이동했다.

## Scope
- `frontend/src/features/lms/components/lecture-studio/LectureStudioEditor.tsx`
- `frontend/src/features/lms/components/lecture-studio/LectureStudioEditorSections.tsx`
- `frontend/src/features/lms/components/lecture-studio/LectureStudioEditorCoreSections.tsx`
- `frontend/src/features/lms/components/lecture-studio/LectureStudioEditorFormSections.tsx`
- `frontend/src/features/lms/components/lecture-studio/LectureStudioPreview.tsx`
- `frontend/src/features/lms/components/lecture-studio/LectureStudioPreviewSections.tsx`
- `frontend/src/features/lms/components/ShortformWizardStep3.tsx`
- `frontend/src/features/lms/components/ShortformWizardStep3Sections.tsx`
- `frontend/src/features/lms/components/CourseExploreDetailPanel.tsx`
- `frontend/src/features/lms/components/CourseExploreDetailPanelBody.tsx`
- `frontend/src/features/lms/pages/AdminAssignPage.tsx`
- `frontend/src/features/lms/pages/AdminAssignPageSections.tsx`
- `frontend/src/features/lms/components/media-pipeline/MediaPipelineBoardSections.tsx`
- `frontend/src/features/lms/components/media-pipeline/MediaPipelineBoardSectionsParts.tsx`

## Validation
- `npm run verify` 재통과 예정

## Notes
- 신규 섹션 파일은 150~200줄 기준을 최대한 맞췄다.
- 대형 원본 파일은 대부분 100줄 내외로 줄었다.
