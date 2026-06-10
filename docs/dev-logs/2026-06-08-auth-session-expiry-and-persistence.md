# 2026-06-08 auth session expiry and persistence hardening

## Context
- Issue `#215` asks for Spring AI/Media persistence hardening and backend-centered auth validation.
- The codebase already persisted AI settings, media transcript, and pipeline state through `FeatureStoreAiFacade`, `FeatureStoreMediaFacade`, and `FeatureJdbcStore`.

## What changed
- Added an integration check in `AuthSemanticsIntegrationTest` that:
  - logs in a demo user,
  - extracts the JWT `jti`,
  - forces the matching `auth_sessions` row to expire,
  - verifies `/api/v1/auth/me` returns `401 UNAUTHENTICATED`.
- Marked `T009`, `T010`, and `T011` as complete in `specs/003-spring-phase3/tasks.md`.

## Verification
- `npm exec tsx -- scripts/run-maven-wrapper.ts -Dtest=AuthSemanticsIntegrationTest test`
- `npm run verify`

## Notes
- AI settings persistence is already backed by `kv_store` through `AiFeatureService`.
- Media transcript and pipeline state are already persisted through `FeatureStoreMediaFacade` and `FeatureJdbcStore`.
- The new test closes the remaining gap by proving backend-side session expiry revalidation instead of trusting the client token alone.
