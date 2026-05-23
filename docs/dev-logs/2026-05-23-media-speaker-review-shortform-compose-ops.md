# 2026-05-23 Media Speaker Review + Shortform Compose Ops

## Summary
- Added admin/instructor speaker-review panel on Media Pipeline page.
- Aligned shortform compose flow to send explicit timestamp clips (lecture_id/start_ms/end_ms).
- Fixed shortform export retry to re-dispatch export job immediately.
- Extended shared shortform compose request type for backend-compatible payload.

## Why
- Existing shortform compose request path depended on extraction candidates that were not aligned with backend payload shape, causing compose failures.
- Speaker-review API existed but operator UI was missing.
- Retry endpoint changed status only but did not dispatch a new export job.

## Verification
- `npm run build:frontend`
- `npm --workspace @myway/frontend run test`
- `./mvnw -q -DskipTests compile` (backend-spring)
- `./mvnw -q "-Dtest=MediaContractTest,StudentLearningFlowContractTest" test` (backend-spring)

## Risk / Rollback
- Risk: low-medium (frontend compose payload + operator panel + retry dispatch path).
- Rollback: revert this commit; compose will return to previous extraction-candidate flow.
