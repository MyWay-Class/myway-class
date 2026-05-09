# 2026-05-09 Transcribe default provider contract

## 요약
- `/api/v1/media/transcribe` 직접 호출에서 `stt_provider`, `stt_model`을 생략해도 기본 정책이 유지되는지 계약 테스트를 추가했다.

## 변경
- `MediaContractTest.transcribe_shouldUseCloudflareDefaults_whenProviderAndModelAreOmitted`
  - 입력에서 provider/model 생략
  - 응답 기본값 `cloudflare` / `cf-whisper` 검증

## 목적
- 자동 전사(callback)뿐 아니라 직접 전사 API 경로에서도 기본 STT 정책 회귀를 방지한다.
