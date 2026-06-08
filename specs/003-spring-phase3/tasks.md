# Tasks: Spring Backend Phase 3 Persistence & Pipeline

**Input**: Design documents from `/specs/003-spring-phase3/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create `backend-spring/src/main/java/com/myway/backendspring/persistence/` package skeleton
- [x] T002 Add persistence dependencies and test dependencies in `backend-spring/pom.xml`
- [x] T003 [P] Create migration/schema bootstrap files in `backend-spring/src/main/resources/`

## Phase 2: Foundational (Blocking)

- [x] T004 Implement persistent AI settings store and entity mappings
- [x] T005 [P] Implement persistent media job store and entity mappings
- [x] T006 [P] Implement persistent transcript store and entity mappings
- [x] T007 [P] Implement persistent shortform export job store and entity mappings
- [x] T008 Add optimistic versioning/idempotency guard for callbacks

> Implementation note: the repository responsibilities above are realized through the shared
> `FeatureJdbcStore` persistence core plus `FeatureStoreRepository`, `JdbcAiUsageDailyStore`,
> and `JdbcActivityEventStore`. The codebase does not need one dedicated repository class per
> entity to satisfy the persistence contract.

## Phase 3: User Story 1 - Persistent Media and AI State (P1)

**Independent Test**: restart-like test scenario with persisted state reload

- [x] T009 [US1] Replace in-memory AI settings read/write in `AiController` with persistent service
- [x] T010 [US1] Replace media transcript/pipeline state storage in `MediaController` with persistent service
- [x] T011 [US1] Add integration test for restart persistence in `backend-spring/src/test/java/.../integration/`

## Phase 4: User Story 2 - Reliable Shortform Retry Flow (P2)

**Independent Test**: failed export → retry → callback transitions

- [x] T012 [US2] Implement shortform export state machine service
- [x] T013 [US2] Apply retry-count cap and terminal `FAILED_PERMANENT` transition
- [x] T014 [US2] Update `ShortformController` retry/callback endpoints to use state machine
- [x] T015 [US2] Add integration tests for retry and stale callback rejection

## Phase 5: User Story 3 - Contract Guard for Spring APIs (P3)

**Independent Test**: contract suite validates envelope/auth semantics

- [x] T016 [US3] Create contract test base for API envelope assertions
- [x] T017 [US3] Add contract tests for `/api/v1/ai/*` endpoints
- [x] T018 [US3] Add contract tests for `/api/v1/media/*` endpoints
- [x] T019 [US3] Add contract tests for `/api/v1/shortform/*` and `/api/v1/custom-courses/*`
- [x] T020 [US3] Add auth regression tests (`401`, `UNAUTHENTICATED`)

## Phase 6: Polish

- [x] T021 Update `backend-spring/README.md` with persistence architecture and retry policy
- [x] T022 [P] Add troubleshooting notes for callback/version conflicts
- [x] T023 Run full verification and capture outputs in PR body

## Dependencies & Execution Order

- T001-T003 → T004-T008 → (US1/US2/US3 in priority order)
- US2 depends on T007 and T008 completion
- US3 depends on API behavior stabilization from US1/US2

## Parallel Opportunities

- T005/T006/T007 can run in parallel after T001/T002
- T017/T018/T019 can run in parallel after contract base(T016)
