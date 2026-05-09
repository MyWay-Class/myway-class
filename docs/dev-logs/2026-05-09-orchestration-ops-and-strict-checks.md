# 2026-05-09 오케스트레이션 운영 기준 및 strict 체크 스크립트 보강

## 요약
- 오케스트레이션 운영 기준 문서(`strict` 기본, `baseline` 예외)를 추가했다.
- strict 체크 공백을 줄이기 위해 루트 스크립트에 `lint`, `perf:smoke`를 추가했다.

## 변경
- `docs/project/22-orchestration-operations.md` 추가
- `package.json`
  - `lint`: `npm --workspace @myway/backend run build && npm --workspace @myway/frontend run build`
  - `perf:smoke`: `npm run build:frontend`

## 검증
- `ORCH_PROFILE=strict npm run orch:checks`
- `ORCH_PROFILE=strict npm run orch:run`
