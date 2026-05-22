# 2026-05-22 Smoke Script Validation Upgrade

## Summary
- Strengthened `smoke:media-ai-shortform` to verify AI search source structure and multi-lecture shortform compose payload.
- Added explicit checks for `/api/v1/ai/search` source ranges (`start_ms`, `end_ms`).
- Added multi-lecture compose assertion for `lec_java_01/02/03` clip preservation in export payload.

## Verification
- `npm run smoke:media-ai-shortform` passed on local backend.

## Risk / Rollback
- Risk: low. Smoke assertion scope only.
- Rollback: revert this commit if smoke must be relaxed.
