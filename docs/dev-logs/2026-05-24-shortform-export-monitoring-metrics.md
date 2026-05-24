# 2026-05-24 Shortform Export Monitoring Metrics

## Summary
- Extended shortform admin export status with operational monitoring fields.
- Added stale processing detection and aggregate failure ratio for faster triage.

## What changed
- `backend-spring/src/main/java/com/myway/backendspring/feature/shortform/ShortformService.java`
  - Added `stale_processing_count` in export status response.
  - Added `failure_ratio` (failed+failed_permanent / total).
  - Added configurable stale threshold: `myway.shortform.monitoring.stale-processing-ms` (default 30m).
- `backend-spring/src/test/java/com/myway/backendspring/integration/ShortformAdminExportOpsIntegrationTest.java`
  - Added assertions for `stale_processing_count` and `failure_ratio` presence/range.

## Verification
- `cd backend-spring && .\\mvnw.cmd "-Dtest=ShortformAdminExportOpsIntegrationTest,ShortformComposeClipsIntegrationTest" test`

## Risk / Rollback
- Risk: low (read-model metrics augmentation only).
- Rollback: revert this PR.
