# 2026-05-09 Runtime env default policy integration test

## 요약
- `myway.runtime.env=staging` 환경에서 AI 기본 provider/model이 `gemini`/`gemini-1.5-flash`로 노출되는지 통합 테스트를 추가했다.

## 변경
- `RuntimeEnvDefaultPolicyIntegrationTest` 추가
  - 로그인 후 `/api/v1/ai/settings` 응답의 기본 정책값 검증

## 목적
- 런타임 환경별 기본 정책(dev vs non-dev) 회귀를 CI에서 조기에 탐지한다.
