# Shortform Callback / Version 충돌 트러블슈팅

## 증상
- export callback이 왔는데 상태가 갱신되지 않음
- `FAILED` 이후 다시 `PROCESSING`으로 보냈는데 이전 callback이 상태를 덮어씀
- 동일 callback 재전송 시 상태가 흔들림
- media extraction callback에서도 같은 식으로 오래된 상태가 다시 반영되는 것처럼 보임
- shortform retry 후 callback이 성공했는데도 `last_event_version`이 그대로이거나 과거 값으로 보임

## 원인
- callback `event_version`이 이미 처리된 `last_event_version` 이하
- 구버전 callback 재전송 또는 지연 도착
- media extraction / shortform export 모두 같은 stale-event guard를 사용한다
- retry API가 새 버전을 만들지 않고 이전 callback payload를 재사용함

## 확인 방법
1. 대상 shortform 레코드의 `last_event_version` 확인
2. callback payload의 `event_version`과 비교
3. `event_version <= last_event_version`이면 서버가 무시하는 것이 정상
4. media extraction인 경우에도 동일하게 extraction 레코드의 `last_event_version`을 확인
5. 서버 로그에 `stale callback` 또는 `replay` 관련 메시지가 있는지 확인

## 대응 방법
1. callback 발행자에서 `event_version`을 단조 증가로 관리
2. 재시도 시에도 동일 버전을 재사용하지 말고 새 버전으로 발행
3. 실패 상태에서 재시도 API(`/api/v1/shortform/retry`)로 `PROCESSING` 재진입 후 callback 발행
4. media extraction callback은 재전송보다 새로운 event version 발행을 우선한다
5. callback secret 또는 processor token을 바꾼 뒤에도 같은 증상이면 stale version 문제로 보고 payload version을 먼저 확인한다

## 운영 체크리스트
- [ ] callback producer가 shortform 단위로 증가 버전을 보장하는가
- [ ] callback 재전송 로직이 과거 버전을 재사용하지 않는가
- [ ] `retry_count`가 상한(`myway.shortform.retry.max-attempts`)을 초과하지 않는가
- [ ] media extraction callback도 `event_version`이 단조 증가하는가
- [ ] 오래된 callback이 와도 `last_event_version`이 되돌아가지 않는가
- [ ] callback 실패와 stale version을 구분할 수 있도록 로그가 남는가
