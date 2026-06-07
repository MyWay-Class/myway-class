# 2026-05-09 STT duration cap contract

## 요약
- 공개 테스트 정책의 STT 최대 길이(3분) 회귀를 막기 위해 계약 테스트를 추가했다.

## 변경
- `MediaContractTest.transcribe_shouldCapDurationToPublicPolicyLimit`
  - `duration_ms=999999` 요청 시 응답 `duration_ms=180000` 검증
  - 기본 STT provider/model이 `cloudflare`/`cf-whisper`인지 함께 검증

## 목적
- 공개 테스트 정책(최대 3분)이 코드 변경으로 깨지는 것을 CI에서 즉시 탐지한다.
