# 2026-05-24 Auth Session And DB Login Users

## Summary
- Removed frontend local fallback session token flow and enforced backend-issued JWT only.
- Switched login user list source to backend `/api/v1/auth/users` so demo login matches real DB users.
- Added temporary frontend alias mapping for legacy demo IDs to current backend course/lecture IDs to prevent immediate 404 regressions.

## What changed
- `frontend/src/lib/api-session.ts`
  - remove local fake token fallback (`local-*`)
  - clear stored auth when `/api/v1/auth/me` validation fails
  - add `loadLoginUsers()` from backend API
- `frontend/src/App.tsx`
  - initialize login options from `loadLoginUsers()`
- `frontend/src/lib/api.ts`
  - export `loadLoginUsers`
- `packages/shared/src/data/users.ts`
  - normalize instructor id typo (`usr_inst_001` -> `usr_ins_001`)
- `frontend/src/lib/api-courses.ts`
  - add temporary alias map (`crs_demo_ai`, `lec_ai_001` etc.) to active backend IDs

## Verification
- `npm run build:frontend`
- `ORCH_PROFILE=strict ORCH_TARGET_BRANCH=dev npm run orch:run` (approved)

## Risk / Rollback
- Risk: medium (auth/session bootstrap path changed; stale local storage is now invalidated by design).
- Rollback: revert commit `fix(auth): use backend-only jwt session and db-backed login users` and this log commit.
