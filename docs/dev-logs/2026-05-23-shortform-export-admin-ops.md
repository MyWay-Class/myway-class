# 2026-05-23 Shortform Export Admin Ops

## Summary
- Added admin-only shortform export status API and failed-export bulk retry API.
- Added Media Pipeline admin panel to show shortform export queue counts and failed items.
- Added integration test coverage for admin-only access and retry flow.

## Backend
- `GET /api/v1/shortform/admin/export-status`
- `POST /api/v1/shortform/admin/export/retry-failed`
- `ShortformService.retryShortformExport` now reuses internal dispatch-aware retry path.

## Frontend
- Added admin queue visibility and failed-batch retry button in Media Pipeline page.
- Added `loadShortformExportStatus`, `retryFailedShortformExports` API helpers.

## Verification
- `npm run build:frontend`
- `npm --workspace @myway/frontend run test`
- `./mvnw -q -DskipTests compile` (backend-spring)
- `./mvnw -q "-Dtest=ShortformAdminExportOpsIntegrationTest,ShortformRetryStateIntegrationTest,MediaContractTest,StudentLearningFlowContractTest" test` (backend-spring)

## Risk / Rollback
- Risk: low-medium (admin ops endpoints + dashboard panel)
- Rollback: revert this commit to restore prior behavior.
