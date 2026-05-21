# Research Notes

## Storage Strategy

- 선택: Spring JDBC 기반 단순 repository + SQL schema.
- 이유: 현재 단계는 빠른 마이그레이션이 목적이며 JPA 복잡도보다 명시적 SQL 관리가 유리.
- 대안 기각: JPA는 학습/튜닝 비용이 추가되고 현재 데이터 구조가 단순해 과함.

## Callback Idempotency Strategy

- 각 callback 이벤트에 `event_version` 또는 `event_time`을 저장.
- 저장된 최신 버전보다 낮거나 같은 이벤트는 무시.
- 상태 전이는 허용된 방향으로만 진행 (역행 금지).

## Retry Policy

- 최대 재시도 횟수: 3회 (초기값, 설정화 가능)
- 전이: `FAILED -> PROCESSING` (retry) / `PROCESSING -> FAILED|COMPLETED`
- 재시도 한계 초과 시 `FAILED_PERMANENT`.

## Contract Test Scope

- Envelope: `success`, `data`, `error`, `message`
- Auth: 미인증 호출 시 `401` + `UNAUTHENTICATED`
- 주요 엔드포인트: ai/media/shortform/custom-courses CRUD/액션 경로
