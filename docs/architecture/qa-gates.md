# QA Gates

Owner: `qa-integrator`

## Scope
- This document is the merge gate source for PR review and QA sign-off.
- Use together with:
  - `.github/pull_request_template.md`
  - `.github/workflows/verify-workspace.yml`

## Layer Gates
- application: unit tests
- adapter/persistence: integration tests
- api: contract/e2e tests

## Verification Path
1. Run workspace verification: `npm run verify`
2. Run backend suite when backend changes exist: `npm run test:backend`
3. Confirm architecture rule compliance against `docs/architecture/Architecture-Rules.md`
4. If exception exists (`REQUIRES_NEW`, cross-context sync call, temporary raw map), link ADR from `docs/decisions/`

## PR Checklist
- [ ] Dependency direction rule passed (`api -> domain`, no `api -> persistence`).
- [ ] No new raw `Map<String,Object>` boundary usage.
- [ ] DTO boundary rule respected.
- [ ] Transaction rule respected (`@Transactional` in application only).
- [ ] Event metadata/idempotency rule respected.
- [ ] Query key centralized and invalidate targets explicit.
- [ ] Required ADR linked when exception exists.
- [ ] Required test layer updated.

## Evidence Required In PR
- Verification command output summary (`npm run verify`, plus layer tests run)
- Files and modules affected
- ADR link when exception rule is used
- Risk and rollback note when behavior path changed

## Gate Decision
- Any hard-rule violation blocks merge.
- Exception path requires ADR approved link.
