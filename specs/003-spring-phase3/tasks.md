# Tasks: Spring Backend Phase 3 Persistence & Pipeline

**Input**: Design documents from `/specs/003-spring-phase3/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create `backend-spring/src/main/java/com/myway/backendspring/persistence/` package skeleton
- [ ] T002 Add persistence dependencies and test dependencies in `backend-spring/pom.xml`
- [ ] T003 [P] Create migration/schema bootstrap files in `backend-spring/src/main/resources/`

## Phase 2: Foundational (Blocking)

- [ ] T004 Implement `AiRuntimeSettingRepository` and entity mappings
- [ ] T005 [P] Implement `MediaJobRepository` and entity mappings
- [ ] T006 [P] Implement `TranscriptRepository` and entity mappings
- [ ] T007 [P] Implement `ShortformExportJobRepository` and entity mappings
- [ ] T008 Add optimistic versioning/idempotency guard for callbacks

## Phase 3: User Story 1 - Persistent Media and AI State (P1)

**Independent Test**: restart-like test scenario with persisted state reload

- [ ] T009 [US1] Replace in-memory AI settings read/write in `AiController` with persistent service
- [ ] T010 [US1] Replace media transcript/pipeline state storage in `MediaController` with persistent service
- [ ] T011 [US1] Add integration test for restart persistence in `backend-spring/src/test/java/.../integration/`

## Phase 4: User Story 2 - Reliable Shortform Retry Flow (P2)

**Independent Test**: failed export → retry → callback transitions

- [ ] T012 [US2] Implement shortform export state machine service
- [ ] T013 [US2] Apply retry-count cap and terminal `FAILED_PERMANENT` transition
- [ ] T014 [US2] Update `ShortformController` retry/callback endpoints to use state machine
- [ ] T015 [US2] Add integration tests for retry and stale callback rejection

## Phase 5: User Story 3 - Contract Guard for Spring APIs (P3)

**Independent Test**: contract suite validates envelope/auth semantics

- [ ] T016 [US3] Create contract test base for API envelope assertions
- [ ] T017 [US3] Add contract tests for `/api/v1/ai/*` endpoints
- [ ] T018 [US3] Add contract tests for `/api/v1/media/*` endpoints
- [ ] T019 [US3] Add contract tests for `/api/v1/shortform/*` and `/api/v1/custom-courses/*`
- [ ] T020 [US3] Add auth regression tests (`401`, `UNAUTHENTICATED`)

## Phase 6: Polish

- [ ] T021 Update `backend-spring/README.md` with persistence architecture and retry policy
- [ ] T022 [P] Add troubleshooting notes for callback/version conflicts
- [ ] T023 Run full verification and capture outputs in PR body

## Dependencies & Execution Order

- T001-T003 → T004-T008 → (US1/US2/US3 in priority order)
- US2 depends on T007 and T008 completion
- US3 depends on API behavior stabilization from US1/US2

## Parallel Opportunities

- T005/T006/T007 can run in parallel after T001/T002
- T017/T018/T019 can run in parallel after contract base(T016)
