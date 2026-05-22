# 2026-05-22 Batch Failed Lecture Course Title Fix

## Summary
- Fixed admin media batch failure metadata so `course_title` now resolves to the actual course title instead of the course id.
- Kept fallback behavior to course id when course detail title is unavailable.
- Added integration assertion to ensure failed lecture metadata includes non-blank `course_title`.

## Files
- `backend-spring/src/main/java/com/myway/backendspring/feature/media/MediaBatchService.java`
- `backend-spring/src/test/java/com/myway/backendspring/integration/AdminMediaBatchIntegrationTest.java`

## Verification
- `npm run test:backend:clean` passed (59 tests, 0 failures)

## Risk / Rollback
- Risk: low. Metadata enrichment only; no API contract shape change.
- Rollback: revert commit `aa6712d` (and follow-up docs commit in this branch if needed).
