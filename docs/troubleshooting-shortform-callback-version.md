# Shortform Callback / Version 충돌 트러블슈팅

## 증상
- export callback이 왔는데 상태가 갱신되지 않음
- `FAILED` 이후 다시 `PROCESSING`으로 보냈는데 이전 callback이 상태를 덮어씀
- 동일 callback 재전송 시 상태가 흔들림

## 원인
- callback `event_version`이 이미 처리된 `last_event_version` 이하
- 구버전 callback 재전송 또는 지연 도착

## 확인 방법
1. 대상 shortform 레코드의 `last_event_version` 확인
2. callback payload의 `event_version`과 비교
3. `event_version <= last_event_version`이면 서버가 무시하는 것이 정상

## 대응 방법
1. callback 발행자에서 `event_version`을 단조 증가로 관리
2. 재시도 시에도 동일 버전을 재사용하지 말고 새 버전으로 발행
3. 실패 상태에서 재시도 API(`/api/v1/shortform/retry`)로 `PROCESSING` 재진입 후 callback 발행

## 운영 체크리스트
- [ ] callback producer가 shortform 단위로 증가 버전을 보장하는가
- [ ] callback 재전송 로직이 과거 버전을 재사용하지 않는가
- [ ] `retry_count`가 상한(`myway.shortform.retry.max-attempts`)을 초과하지 않는가
