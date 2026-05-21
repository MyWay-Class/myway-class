# Feature Specification: Spring Backend Phase 3 Persistence & Pipeline

**Feature Branch**: `003-spring-phase3`  
**Created**: 2026-04-30  
**Status**: Draft  
**Input**: User description: "Spring 3차 이식: media/shortform/ai/custom-courses 인메모리 구현을 실제 저장소 기반으로 교체하고, 비동기 콜백/재시도 정책과 계약 테스트를 추가한다"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Persistent Media and AI State (Priority: P1)

백엔드 운영자는 서버 재시작 이후에도 미디어 추출 상태, 트랜스크립트, AI 설정이 유지되어야 한다.

**Why this priority**: 현재 인메모리 구조는 재시작 시 상태가 소실되어 운영 신뢰성이 없다.

**Independent Test**: 미디어 추출/AI 설정 저장 후 서버 재기동, 동일 데이터 재조회 성공 확인.

**Acceptance Scenarios**:

1. **Given** 사용자가 `/api/v1/media/extract-audio`를 호출해 추출 상태가 생성됨, **When** 서버가 재시작됨, **Then** `/api/v1/media/pipeline/{lectureId}`에서 기존 상태를 조회할 수 있어야 한다.
2. **Given** 관리자가 `/api/v1/ai/settings`를 갱신함, **When** 서버가 재시작됨, **Then** `/api/v1/ai/settings`에 마지막 설정이 유지되어야 한다.

---

### User Story 2 - Reliable Shortform Export Retry Flow (Priority: P2)

콘텐츠 운영자는 숏폼 export 실패 시 재시도 정책에 따라 자동/수동 복구할 수 있어야 한다.

**Why this priority**: 현재 숏폼 export는 성공 경로 위주 구현이며 실패 복구 정책이 약하다.

**Independent Test**: 실패 콜백 주입 후 재시도 API 호출 시 상태 전이가 정의대로 진행되는지 검증.

**Acceptance Scenarios**:

1. **Given** 숏폼 export 상태가 `FAILED`, **When** `/api/v1/shortform/{id}/export/retry` 호출, **Then** 상태가 `PROCESSING`으로 전이되고 재시도 횟수가 증가해야 한다.
2. **Given** `PROCESSING` 상태에서 콜백 실패 이벤트 수신, **When** 최대 재시도 횟수 초과, **Then** 최종 상태는 `FAILED_PERMANENT`로 기록되어야 한다.

---

### User Story 3 - Contract Guard for Spring APIs (Priority: P3)

프론트엔드 개발자는 Spring API가 기존 계약을 깨지 않는지 자동으로 확인하고 싶다.

**Why this priority**: 빠른 이식 과정에서 응답 스키마/에러 코드 회귀 위험이 높다.

**Independent Test**: 계약 테스트 실행 시 핵심 엔드포인트의 필수 필드와 상태코드가 보장되는지 확인.

**Acceptance Scenarios**:

1. **Given** API 계약 테스트가 실행됨, **When** `/api/v1/media/*` 응답을 검증함, **Then** `success/data/error/message` 포맷 불일치가 있으면 실패해야 한다.
2. **Given** 인증 필요 엔드포인트를 토큰 없이 호출함, **When** 응답을 검증함, **Then** `401`과 `UNAUTHENTICATED` 에러 코드가 일치해야 한다.

---

### Edge Cases

- 저장소 연결 실패(DB down) 시 읽기 전용 폴백 응답 정책은 어떻게 동작하는가?
- 동일 shortform에 대해 중복 retry 요청이 동시에 들어오면 상태 경쟁 조건을 어떻게 처리하는가?
- 오래된 콜백(지연 도착)이 최신 상태를 덮어쓰지 않도록 어떻게 보장하는가?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist media extraction, transcript, pipeline state in durable storage.
- **FR-002**: System MUST persist AI settings and provider selection with last-write-wins semantics.
- **FR-003**: System MUST implement shortform export retry state machine with bounded retry count.
- **FR-004**: System MUST reject stale callback updates based on monotonic event timestamp or version.
- **FR-005**: System MUST provide contract tests for ai/media/shortform/custom-courses major endpoints.
- **FR-006**: System MUST preserve current auth failure semantics (`401`, `UNAUTHENTICATED`).
- **FR-007**: System MUST keep API envelope format consistent (`success/data/error/message`).

### Key Entities *(include if feature involves data)*

- **MediaJob**: lecture-level extraction job with status, retry metadata, callback trace.
- **TranscriptDocument**: lecture transcript with segments and provenance metadata.
- **ShortformExportJob**: shortform export execution record with state transitions.
- **AiRuntimeSetting**: configurable AI provider/model/rate-limit policy persisted across restarts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 서버 재시작 후 media/ai 상태 복원 성공률 100% (테스트 데이터 기준).
- **SC-002**: shortform retry 상태 전이 테스트 케이스 100% 통과.
- **SC-003**: 계약 테스트에서 핵심 엔드포인트(최소 20개 assertion) 100% 통과.
- **SC-004**: 인증 누락 요청에 대해 정의된 에러 응답 회귀 0건.

## Assumptions

- 현재 3차 범위에서는 새로운 UI 변경 없이 백엔드 API 안정화에 집중한다.
- 저장소는 Spring 환경에서 접근 가능한 단일 durable store(D1/JDBC 호환)를 사용한다.
- 콜백 인증 메커니즘(secret/token)은 기존 정책을 유지하고 확장한다.
- 운영 트래픽은 중간 규모이며 강한 분산 락 대신 낙관적 동시성으로 처리 가능하다.
