# Map<String, Object> Migration Plan

## Scope Snapshot (2026-05-12)
- Backend occurrences: `461`
- Frontend occurrences: `0` (`Map<String, Object>` Java pattern not used)

## Priority Matrix
1. P0 (API boundary safety)
- `backend-spring/src/main/java/com/myway/backendspring/api/AiController.java` (42)
- `backend-spring/src/main/java/com/myway/backendspring/api/MediaController.java` (20)
- `backend-spring/src/main/java/com/myway/backendspring/api/ShortformController.java` (21)
- Goal: `@RequestBody Map<String,Object>` 제거, request/response DTO + mapper 적용.

2. P1 (Core domain/service typing)
- `backend-spring/src/main/java/com/myway/backendspring/feature/FeatureStoreService.java` (62)
- `backend-spring/src/main/java/com/myway/backendspring/feature/media/MediaTranscriptionService.java` (39)
- `backend-spring/src/main/java/com/myway/backendspring/feature/media/MediaProcessingService.java` (22)
- `backend-spring/src/main/java/com/myway/backendspring/feature/media/MediaPipelineService.java` (20)
- `backend-spring/src/main/java/com/myway/backendspring/feature/rag/RagService.java` (25)
- `backend-spring/src/main/java/com/myway/backendspring/feature/shortform/ShortformService.java` (25)
- Goal: domain model, command/result 타입, enum status 적용.

3. P2 (Persistence abstraction)
- `backend-spring/src/main/java/com/myway/backendspring/persistence/FeatureJdbcStore.java` (16)
- Goal: `FeatureStoreRepository`를 얇게 유지하되, context별 repository interface로 분리하고 serialization DTO 명시.

4. P3 (Legacy compatibility)
- `backend-spring/src/main/java/com/myway/backendspring/api/NotImplementedController.java` (55)
- Goal: legacy endpoint는 유지하되 내부 adapter layer에서만 map 사용 허용.

## Execution Order
1. `ai`/`media` API request DTO + validation(zod 대응되는 백엔드 계약) 먼저 적용.
2. `media` pipeline status 문자열을 enum으로 치환.
3. `rag` retrieval/rerank/answer 인터페이스 분리와 함께 result model 도입.
4. `shortform` command/result DTO 분리.
5. `FeatureJdbcStore` read/write DTO serialization 모듈로 이동.

## Guardrails
- 신규 `Map<String, Object>` 도입 금지.
- controller/service 간 raw map 전달 금지.
- entity -> API response direct 반환 금지.
- 예외(구조적) 발생 시 `docs/decisions/ADR-POLICY.md` 기준 ADR 필수.

## Verification Gates
- application unit: command/mapper/enum 변환 테스트
- persistence integration: JSON serialization round-trip 테스트
- api contract/e2e: 기존 응답 계약(snapshot/contract) 유지 검증
