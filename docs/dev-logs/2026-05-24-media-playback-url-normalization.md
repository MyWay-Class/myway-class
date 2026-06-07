# 2026-05-24 Media Playback URL Normalization

## Summary
- Fixed local playback failures caused by encoded slash (`%2F`) asset paths.
- Normalized media asset URLs to canonical slash paths before playback token injection.

## What changed
- `frontend/src/lib/video-url.ts`
  - Added canonicalization for `/api/v1/media/assets/*` paths.
  - Converts encoded key form (`media%2Fcourse%2Flecture.mp4`) into canonical path form (`media/course/lecture.mp4`).
  - Updated asset key path builder to encode by segment, preserving path separators.
- `frontend/src/lib/video-url.test.ts`
  - Added regression test for encoded-slash URL normalization.

## Verification
- `npm --workspace @myway/frontend run test -- video-url.test.ts`
- `npm run build:frontend`
- Manual header check:
  - encoded path request -> Tomcat-level `400` (no CORS header)
  - normalized path request -> app-level `401` with `Access-Control-Allow-Origin` and `X-Error-Code`

## Risk / Rollback
- Risk: low (URL normalization only, scoped to media asset URLs).
- Rollback: revert this PR.
