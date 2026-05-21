# 2026-05-05 media callback event version guard 추가

## 요약
- `/api/v1/media/extract-audio/callback`에 `event_version` 기반 stale-event guard를 추가
- 오래된 callback(`event_version <= last_event_version`)은 상태 갱신 없이 무시
- shortform callback과 동일한 idempotency 패턴으로 media callback 정책 정합성 확보
- 통합 테스트 `MediaCallbackVersionIntegrationTest` 추가 (FAILED→stale 무시→COMPLETED 전이 검증)

## 검증
- 로컬 Maven 테스트는 환경 제약으로 미실행
  - `JAVA_HOME` 설정 후 `mvnw` 실행 시 wrapper 다운로드 네트워크 실패
