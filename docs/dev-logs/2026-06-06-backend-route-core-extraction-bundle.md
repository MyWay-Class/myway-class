# Backend Route/Core Extraction Bundle

Date: 2026-06-06

## Summary
- Moved the largest backend route/service entry files into `*-core.ts` implementations.
- Kept public entrypoints as thin barrels so existing imports remain stable.
- Split `dev-server.ts` into a barrel + `dev-server-core.ts` implementation.

## Moved entrypoints
- `backend/src/routes/media.ts` -> `backend/src/routes/media-core.ts`
- `backend/src/routes/ai.ts` -> `backend/src/routes/ai-core.ts`
- `backend/src/routes/shortform.ts` -> `backend/src/routes/shortform-core.ts`
- `backend/src/routes/courses.ts` -> `backend/src/routes/courses-core.ts`
- `backend/src/routes/lecture-drafts.ts` -> `backend/src/routes/lecture-drafts-core.ts`
- `backend/src/routes/custom-courses.ts` -> `backend/src/routes/custom-courses-core.ts`
- `backend/src/lib/media-pipeline-actions.ts` -> `backend/src/lib/media-pipeline-actions-core.ts`
- `backend/src/lib/smart-chat.ts` -> `backend/src/lib/smart-chat-core.ts`
- `backend/src/dev-server.ts` -> `backend/src/dev-server-core.ts`

## Verification
- `npm run verify` passed
- Backend contract and integration suites passed
