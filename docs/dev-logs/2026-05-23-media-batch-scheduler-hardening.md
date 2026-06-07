# 2026-05-23 Media Batch Scheduler Hardening

## Summary
- Switched media auto batch execution to cron-first scheduling (daily 2x default) with fixed-delay fallback.
- Set default auto mode to `failed-only` for safer retry-focused operations.
- Hardened mode normalization to accept `failed`, `retry-failed`, `failed-only` consistently.
- Added integration assertion for failed-only run path.

## Default Ops Policy
- `myway.media.batch.auto.use-cron=true`
- `myway.media.batch.auto.cron=0 0 6,18 * * *`
- `myway.media.batch.auto.zone=Asia/Seoul`
- `myway.media.batch.auto.mode=failed-only`

## Verification
- `./mvnw -q -DskipTests compile`
- `./mvnw -q "-Dtest=AdminMediaBatchIntegrationTest,MediaContractTest" test`

## Risk / Rollback
- Risk: low (scheduler trigger policy + mode normalization).
- Rollback: revert this commit to previous fixed-delay-only behavior.
