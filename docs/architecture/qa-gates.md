# QA Gates

Owner: `qa-integrator`

## Layer Gates
- application: unit tests
- adapter/persistence: integration tests
- api: contract/e2e tests

## PR Checklist
- [ ] Dependency direction rule passed (`api -> domain`, no `api -> persistence`).
- [ ] No new raw `Map<String,Object>` boundary usage.
- [ ] DTO boundary rule respected.
- [ ] Transaction rule respected (`@Transactional` in application only).
- [ ] Event metadata/idempotency rule respected.
- [ ] Query key centralized and invalidate targets explicit.
- [ ] Required ADR linked when exception exists.
- [ ] Required test layer updated.

## Gate Decision
- Any hard-rule violation blocks merge.
- Exception path requires ADR approved link.
