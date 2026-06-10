# 2026-06-08 backend ops docs and troubleshooting refresh

## Context
- Issue `#222` covers Phase 3 polish items `T021` and `T022`.
- The backend already had the right runtime behavior; this work tightens the operational docs around it.

## What changed
- Expanded `backend-spring/README.md` with:
  - backend auth persistence details for `auth_users` and `auth_sessions`
  - explicit backend-side JWT expiry validation notes
  - a small Railway/Supabase deployment clarification for JDBC URL consistency
- Expanded `docs/troubleshooting-shortform-callback-version.md` with:
  - an extra symptom for retry/version mismatch
  - a more explicit stale-version diagnosis path
  - a log-based verification checklist item
- Marked `T021` and `T022` complete in `specs/003-spring-phase3/tasks.md`.

## Verification
- Reviewed the updated docs for consistency with current auth/session and callback behavior.
- No code changes were required.

## Notes
- The ops guidance now matches the current backend behavior:
  - JWT signature validation is not enough; `auth_sessions` expiry and revocation are authoritative.
  - callback replay and stale version conflicts are separate failure modes and should be distinguished in logs.
