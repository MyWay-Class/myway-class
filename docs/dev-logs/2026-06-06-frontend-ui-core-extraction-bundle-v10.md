# Frontend UI Core Extraction Bundle v10

## 범위
- 전역 애니메이션, 스튜디오 타입, 재생/숏폼/미디어 상태 훅, 공용 UI sections, course flow, 앱 진입부를 `*Core` 파일로 분리
- 기존 원본 경로는 얇은 barrel entry로 축소

## 결과
- `frontend/src/styles-animations.css` 2줄
- `frontend/src/features/lms/components/lecture-studio/types.ts` 2줄
- `frontend/src/features/lms/pages/useLectureStudioPageFlow.ts` 2줄
- `frontend/src/features/lms/pages/useLectureWatchPlayback.ts` 2줄
- `frontend/src/features/lms/components/useShortformWizardState.ts` 2줄
- `frontend/src/lib/api-lecture-drafts.ts` 2줄
- `frontend/src/features/lms/pages/useMediaPipelinePageState.ts` 2줄
- `frontend/src/features/lms/components/AppSidebarSections.tsx` 2줄
- `frontend/src/features/lms/components/lecture-studio/LectureStudioPreviewSections.tsx` 2줄
- `frontend/src/features/lms/pages/useAIChatPageState.ts` 2줄
- `frontend/src/features/lms/components/media-pipeline/MediaUploadWorkspacePanelSections.tsx` 2줄
- `frontend/src/lib/course-flow.ts` 2줄
- `frontend/src/features/lms/components/CourseExploreDetailPanelBody.tsx` 2줄
- `frontend/src/App.tsx` 2줄

## 검증
- `npm run build:frontend`

## 비고
- 현재 남은 대형 구현은 새로 생성된 `*Core` 파일들이다. 다음 묶음에서는 이 core 구현들을 추가로 분해하면 된다.
