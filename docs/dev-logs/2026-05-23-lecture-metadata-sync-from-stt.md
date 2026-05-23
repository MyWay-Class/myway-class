# 2026-05-23 Lecture Metadata Sync From STT

## Summary
- Added DB-backed lecture metadata scope (`learning_lecture_meta`) synchronization from transcript and speaker-review data.
- Added admin endpoint to run metadata migration/sync in batch.
- Enriched lecture response model with `content_text`, `transcript_excerpt`, `instructor_name` so synced metadata is returned from backend.

## What changed
- Extended lecture item models (domain + API model) with metadata fields.
- In `DemoLearningService`:
  - auto-attach lecture metadata on course detail read
  - lazy-generate metadata when missing from `media_transcript` + `media_speaker_review`
  - explicit sync method: `syncLectureMetadataFromTranscripts(overwriteExisting)`
- New admin API:
  - `POST /api/v1/admin/media/lecture-metadata/sync`
- Integration test updated for admin-only + sync summary response.

## Verification
- `./mvnw -q -DskipTests compile`
- `./mvnw -q "-Dtest=AdminMediaBatchIntegrationTest,StudentLearningFlowContractTest,MediaContractTest" test`

## Risk / Rollback
- Risk: low-medium (lecture payload enrichment and metadata merge on read path).
- Rollback: revert this commit.
