# 2026-05-22 Media Batch Auto Mode Config

## Summary
- Added scheduler mode config for media batch auto-run.
- `MediaBatchScheduler` now supports:
  - `myway.media.batch.auto.mode=all` (default)
  - `myway.media.batch.auto.mode=failed-only`
- Invalid mode values are normalized to `all`.

## Why
- 운영에서 배치 자동 실행을 전체 처리와 실패건 재시도로 분리 운용할 수 있도록 제어 포인트를 추가했다.

## Verification
- `npm run test:backend:clean` passed.
