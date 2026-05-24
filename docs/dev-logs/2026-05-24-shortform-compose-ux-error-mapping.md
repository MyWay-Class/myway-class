# 2026-05-24 Shortform Compose UX Error Mapping and Frontend Optimization

## Summary
- Aligned shortform compose frontend behavior with backend validation/authorization error codes.
- Removed authenticated compose fallback that masked backend failures.
- Optimized clip time update bounds to match backend contract limits.

## What changed
- `frontend/src/lib/api-shortforms.ts`
  - `composeShortformDraft` now returns structured result:
    - `{ video, errorCode, errorMessage }`
  - For authenticated requests, backend failure is surfaced as-is (no local fallback compose).
- `frontend/src/features/lms/components/ShortformWizard.tsx`
  - Added compose error-code mapping:
    - `INVALID_CLIP_RANGE`
    - `CLIP_DURATION_EXCEEDED`
    - `COURSE_LECTURE_MISMATCH`
    - `LECTURE_NOT_FOUND`
    - `FORBIDDEN`
  - Updated `handleCompose` to show precise status messages.
  - Optimized clip time adjustment logic with shared bounds constants:
    - min: 1s
    - max: 5m

## Verification
- `npm run test:frontend`

## Risk / Rollback
- Risk: low-medium (authenticated compose no longer silently falls back).
- Rollback: revert this PR.
