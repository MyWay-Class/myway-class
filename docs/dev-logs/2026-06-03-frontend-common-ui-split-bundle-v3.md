# Frontend Common UI Split Bundle v3

## Summary
- `AssignmentCheckPage`, `AdminUsersPage`, `LectureStudioPage`를 조립기 중심으로 축소
- `ShortformWizardStep3`를 preview/meta/actions/utils 단위로 분리
- `MediaPipelineBoard` 상세 패널을 별도 파일로 분리하고 reexport 정리

## Validation
- `npm run verify` 통과

## Notes
- 원본 페이지는 상태/연산만 남기고 렌더 책임을 섹션 파일로 이동
- 미디어 보드 상세 영역은 `MediaPipelineBoardDetailsSection`으로 분리
