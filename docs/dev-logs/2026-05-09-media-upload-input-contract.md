# 2026-05-09 Media upload input contract

## 요약
- 미디어 업로드 API의 입력 계약 회귀 방지를 위해 `lecture_id` 필수 검증 테스트를 추가했다.

## 변경
- `MediaContractTest.uploadVideo_shouldRequireLectureId_forInstructorOrAdmin`
  - 강사/운영자 권한이 있어도 `lecture_id` 누락 시 `400` + `LECTURE_ID_REQUIRED` 검증

## 목적
- 권한 검증과 입력 검증이 함께 유지되도록 API 계약 안정성을 높인다.
