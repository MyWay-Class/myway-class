# 2026-06-08 shortform export state machine extraction

## 왜 바꿨는가
- shortform retry/callback 정책은 이미 동작하고 있었지만 helper 조합으로 퍼져 있어서, 상태 전이 책임을 하나의 서비스로 묶을 필요가 있었다.
- `T012~T015`의 shortform retry 플로우를 스펙상 더 명확한 단위로 정리하고 싶었다.

## 무엇을 바꿨는가
- `ShortformExportStateMachineService`를 추가해 retry, callback, status 집계를 한 경계로 묶었다.
- `ShortformService`가 retry/callback/status 전이를 새 state machine service를 통해 처리하도록 정리했다.
- `ShortformExportStateMachineServiceTest`를 추가해 retry cap, stale callback 무시, failed-permanent 집계를 검증했다.
- `specs/003-spring-phase3/tasks.md`의 shortform/contract/verification 체크 상태를 갱신했다.

## 어떻게 검증했는가
- `npm exec tsx -- scripts/run-maven-wrapper.ts -Dtest=ShortformExportStateMachineServiceTest test`
- `npm run verify`

## 검증 상태
- 위 두 명령 모두 통과했다.
- 전체 backend test는 `84 passed, 0 failed`였다.
