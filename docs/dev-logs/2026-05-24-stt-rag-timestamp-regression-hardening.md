# 2026-05-24 STT-RAG Timestamp Regression Hardening

## Summary
- Strengthened student learning flow contract to verify transcript segment and RAG chunk timestamp integrity.
- Updated smoke pipeline script to align multi-lecture shortform compose with current canonical course/lecture IDs.

## What changed
- `backend-spring/src/test/java/com/myway/backendspring/contract/StudentLearningFlowContractTest.java`
  - Added checks for transcript segment timestamp range.
  - Added checks for first RAG chunk lecture mapping and timestamp bounds against transcript duration.
- `scripts/smoke-media-ai-shortform.ts`
  - Added RAG chunk timestamp + lecture mapping assertion.
  - Updated multi-lecture compose smoke payload from legacy IDs to canonical IDs:
    - `course_id: crs_java_01`
    - clips: `lec_java_01`, `lec_java_02`

## Verification
- `cd backend-spring && .\\mvnw.cmd "-Dtest=StudentLearningFlowContractTest" test`

## Risk / Rollback
- Risk: low (test/smoke contract hardening only).
- Rollback: revert this PR.
