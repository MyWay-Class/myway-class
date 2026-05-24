# 2026-05-24 media_asset backfill for mapped lectures

## 요약
- `lecture_video_asset`은 있으나 `media_asset`이 비어 있는 케이스를 감사/백필할 수 있는 관리자 API를 추가했다.

## 변경 내용
- `MediaBatchService`
  - `auditMappedLecturesMissingMediaAssets()` 추가.
  - `backfillMissingMediaAssetsForMappedLectures()` 추가.
- `AdminMediaController`
  - `GET /api/v1/admin/media/r2-mappings/media-assets/audit` 추가.
  - `POST /api/v1/admin/media/r2-mappings/media-assets/backfill` 추가.
- `scripts/backend-r2-bulk-map.ps1`
  - 기존 mapping audit/bulk-map 이후,
  - mapped lecture 기준 `media_asset` 누락 감사 + 백필 단계 추가.

## 검증
- `npm run smoke:media-ai-shortform` 통과
- `backend-spring: .\mvnw.cmd "-Dtest=StudentLearningFlowContractTest" test` 통과
