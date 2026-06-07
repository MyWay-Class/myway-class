# 2026-05-09 Cross-platform verify command

## 요약
- 루트 `npm run verify`가 Windows/리눅스에서 동일하게 동작하도록 Maven wrapper 실행을 공통 스크립트로 통합했다.

## 변경 내용
- `scripts/run-maven-wrapper.mjs` 추가
  - Windows: `mvnw.cmd`
  - Non-Windows: `sh mvnw ...`
- `package.json` 스크립트 교체
  - `dev:backend`, `build:backend`, `test:backend`
- `verify-workspace` 워크플로 단순화
  - 수동 `cd/chmod` 단계 제거
  - `npm run verify` 직접 실행

## 기대 효과
- 로컬/CI 검증 절차가 단일 명령으로 일치한다.
- OS별 Maven wrapper 차이로 인한 CI/로컬 불일치가 줄어든다.
