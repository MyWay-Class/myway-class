# 2026-05-09 backend contract: runtime provider policy

- `/api/v1/ai/providers` 계약 테스트에 runtime 선택 반영 검증을 추가했다.
  - `ai/settings`에서 `provider=ollama`(dev 유사)와 `provider=gemini`(non-dev 유사)를 각각 저장했을 때 `current`가 그대로 반영되는지 확인한다.
  - provider 목록에 `demo` fallback이 항상 포함되는지 확인한다.
- `/api/v1/media/providers` 계약 테스트에 STT 정책 검증을 추가했다.
  - `plans.feature=transcribe`의 `current_provider`가 `cloudflare`인지 확인한다.
  - `recommended_chain` 첫 provider가 `cloudflare`인지 확인한다.
- `/api/v1/media/extract-audio/callback` 계약 테스트에 자동 STT 기본 경로 검증을 추가했다.
  - callback 기반 자동 전사 시 응답 transcript의 `stt_provider=cloudflare`, `stt_model=cf-whisper`를 확인한다.
