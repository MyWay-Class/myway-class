# 2026-05-22 Scheduled Smoke Workflow

## Summary
- Extended `.github/workflows/smoke-media-ai-shortform.yml` with a daily schedule trigger.
- Added repository variable fallback for scheduled runs (`SMOKE_BASE_URL` and optional IDs).
- Added a validation step to fail fast when base URL is missing.
- Updated testing docs with scheduled smoke operation details.
- Updated old dev-log reference from `.mjs` to `.ts`.

## Verification
- Workflow YAML reviewed for expression fallbacks and schedule trigger.

## Ops Notes
- Required variable for schedule: `SMOKE_BASE_URL`
- Required secret: `SMOKE_SHORTFORM_CALLBACK_TOKEN`
