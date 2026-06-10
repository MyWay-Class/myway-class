# 2026-06-08 persistence spec reconciliation

## 왜 바꿨는가
- `specs/003-spring-phase3/tasks.md`의 초기 persistence 항목이 현재 코드의 실제 구현과 이름이 달라서, 남은 작업처럼 보이는 drift가 있었다.
- 실제 코드는 개별 repository 클래스 대신 `FeatureJdbcStore` 중심의 shared persistence core로 이미 구현돼 있었기 때문에, 스펙을 현 구조에 맞춰 정리할 필요가 있었다.

## 무엇을 바꿨는가
- Phase 1의 `T001~T003`을 완료로 표시했다.
- Phase 2의 `T004~T007`을 실제 구현 의미에 맞게 재서술하고 완료로 표시했다.
- `FeatureJdbcStore`, `FeatureStoreRepository`, `JdbcAiUsageDailyStore`, `JdbcActivityEventStore`가 스펙상의 repository 책임을 담당한다는 구현 노트를 추가했다.

## 어떻게 검증했는가
- `git diff --check`

## 검증 상태
- 문서 전용 변경이다.
- 코드/테스트 동작에는 영향을 주지 않는다.
