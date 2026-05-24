# 2026-05-24 Canonicalize Demo IDs

## Summary
- Replaced legacy demo-only course/lecture IDs with backend canonical IDs in frontend/shared demo datasets.
- Removed residual `lec_ai_001` references from shared fixtures to prevent fallback path 404s.

## What changed
- `frontend/src/features/lms/data/demo.ts`
  - `crs_demo_ai` -> `crs_react_01`
  - `crs_demo_data` -> `crs_java_01`
  - `lec_demo_ai_*` -> active lecture ids (`lec_react_01`, `lec_react_02`, `lec_java_01`)
- `packages/shared/src/data/ai-logs.ts`
- `packages/shared/src/data/courses.ts`
- `packages/shared/src/data/media.ts`
- `packages/shared/src/lms/learning/course.ts`
  - `lec_ai_001` -> `lec_react_01`

## Verification
- `npm run build:frontend`
- `rg -n "crs_demo_ai|crs_demo_data|lec_demo_ai|lec_ai_001" frontend/src packages/shared/src` (no matches)

## Risk / Rollback
- Risk: low (fixture/demo id alignment only).
- Rollback: revert this PR.
