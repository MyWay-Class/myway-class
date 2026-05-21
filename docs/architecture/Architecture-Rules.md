# Architecture Rules (Single Source of Truth)

## 1) Dependency Direction
- `domain -> common` is allowed.
- `domain -> api` is forbidden.
- `api -> domain(application)` only.
- `api -> persistence` direct access is forbidden.
- `persistence` implements `domain.*.port` only.
- `domain A -> domain B` direct call is forbidden. Use event or approved facade.

## 2) Domain Package Segmentation (Mandatory)
- Single flat `domain` package is forbidden.
- Target package structure:
  - `domain.learning`
  - `domain.media`
  - `domain.rag`
  - `domain.shortform`
  - `domain.ai`
- Inside each context:
  - `application` (use-case/service)
  - `model` (domain model/value object)
  - `port` (repository interface)

## 3) DTO Boundary Rules
- Layered types:
  - Request DTO: `api.dto.request.*`
  - Response DTO: `api.dto.response.*`
  - Persistence Entity(Row): `persistence.entity.*`
  - Domain Model: `domain.*.model.*`
- Rules:
  - New `Map<String,Object>` introduction is forbidden by default.
  - Controller <-> Service raw map passing is forbidden.
  - Entity direct API response return is forbidden.
  - Conversion must be done only in mapper classes.

## 4) Transaction Rules
- `@Transactional` only in `domain.*.application`.
- Transaction annotation in repository layer is forbidden.
- Nested transaction (`REQUIRES_NEW`) is forbidden by default.
- Structural exception (`REQUIRES_NEW`, cross-context sync call) requires ADR.
- Read use-case should use `readOnly=true` by default.

## 5) Domain Event Rules
- Cross-context propagation should prioritize events.
- Sync direct call is limited to same context.
- Required metadata: `eventId`, `occurredAt`, `producer`, `version`.
- Handler must be idempotent.
- Event payload must contain primitive/value object only.
- Passing entity instance as event payload is forbidden.

## 6) Mapper Rules
- Mapper must be single-direction responsibility.
  - Example: `RequestDto -> Command`, `Domain -> ResponseDto`
- Manual mapping in controller/service is forbidden.
- Entity <-> API DTO direct mapping is forbidden.
- Mapping rules must be fixed by tests (field omission/type conversion).

## 7) Naming Convention
- UseCase: `CreateLectureDraftUseCase`
- Port: `LectureRepositoryPort`
- Adapter: `JdbcLectureRepository`
- Mapper: `LectureResponseMapper`

## 8) React Query Key Rules
- Query key centralization is mandatory: `frontend/src/lib/query-keys.ts`
- Example:
  - `queryKeys.learning.detail(id)`
  - `queryKeys.media.pipeline(id)`
  - `queryKeys.shortform.list(params)`
- Inline string literal query key is forbidden.
- Mutation must explicitly declare invalidate targets.

## 9) Frontend State Strategy
- Local UI state: `useState` / `useReducer`
- Server state: TanStack Query
- Form state: react-hook-form
- New `useEffect + fetch + manual loading` pattern is forbidden.

## 10) Frontend Type Strategy
- Network boundary must receive as `unknown`.
- Validation/parsing required before app-internal use (zod recommended).
- Layer:
  - transport type
  - validated DTO
  - domain/view model
- `any` is forbidden.
- `as X` assertion is allowed only after validation.
- Parsing failure must be transformed into common error object.

## 11) Testing Layer Rules
- application: unit test
- adapter/persistence: integration test
- api: contract/e2e test

## 12) Forbidden (Hard Rules)
- static util business logic
- god service
- controller business logic
- bidirectional mapper
- entity serialization as API contract

## 13) ADR Required Cases
- `REQUIRES_NEW`
- cross-context synchronous call
- temporary `Map<String,Object>` exception
- dependency direction exception
