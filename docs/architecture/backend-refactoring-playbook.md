# Backend Refactoring Playbook

Owner: `backend-engineer`

## Scope
- Target contexts:
  - `domain.learning`
  - `domain.media`
  - `domain.rag`
  - `domain.shortform`
  - `domain.ai`
- Each context must have:
  - `application`
  - `model`
  - `port`

## Migration Order
1. Create context package skeleton (`application/model/port`).
2. Move use-case entrypoints first (controller target methods).
3. Move model/value object next.
4. Add port interfaces in domain.
5. Move persistence implementation to adapter/repository side.
6. Remove old flat-domain dependencies.

## Mapper / Port / Adapter Rules
- Mapper names: `*RequestMapper`, `*ResponseMapper`.
- Port names: `*RepositoryPort`, `*GatewayPort`.
- Adapter names: `Jdbc*Repository`, `Http*Gateway`.
- Controller must call application use-cases only.

## Map<String,Object> Removal Order
1. Controller request/response boundary maps.
2. Service orchestration maps between contexts.
3. Persistence read/write row maps.
4. Internal algorithm temporary maps.

## Priority Targets (Current)
1. learning context (`Courses`, `LectureDrafts`) first-class migration.
2. media pipeline DTO boundary hardening.
3. rag internal typed model conversion.

## Done Criteria
- No new raw map across controller-service boundary.
- No `api -> persistence` direct dependency.
- Context package skeleton exists and compile/test pass.
