# 2026-05-24 RAG Timestamp Contract Hardening

## Summary
- Ensured RAG chunks always include `start_ms`/`end_ms` even when transcript is not prepared.
- Added contract test that validates timestamped chunk response and non-empty answer for transcript-missing lecture fallback.

## What changed
- `backend-spring/src/main/java/com/myway/backendspring/feature/rag/RagService.java`
  - Added chunk timestamp normalization (`ensureChunkTimestamps`)
  - Fallback behavior:
    - `start_ms`: defaults to `0`
    - `end_ms`: uses lecture duration when available, otherwise minimum window
- `backend-spring/src/test/java/com/myway/backendspring/contract/AiContractTest.java`
  - Added `aiRag_shouldKeepTimestampedChunks_whenTranscriptIsNotPrepared`
  - Validates chunk timestamps + fallback text/content/excerpt presence + non-empty answer

## Verification
- `cd backend-spring && ./mvnw -q "-Dtest=AiContractTest" test`

## Risk / Rollback
- Risk: low-medium (RAG payload enrichment).
- Rollback: revert this PR.
