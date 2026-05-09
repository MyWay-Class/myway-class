# 2026-05-09 Runtime env dev default policy integration test

## 요약
- `myway.runtime.env=dev`에서 AI 기본 정책(provider/model)이 `ollama`/`llama3.1:8b`로 노출되는지 통합 테스트를 추가했다.

## 변경
- `RuntimeEnvDevDefaultPolicyIntegrationTest` 추가
  - 로그인 후 `/api/v1/ai/settings` 응답의 dev 기본 정책값 검증
  - 테스트 DB를 in-memory H2로 격리

## 목적
- 런타임 환경별 기본 정책(dev vs non-dev) 회귀 탐지를 양방향으로 강화한다.
