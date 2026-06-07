# ADR Policy

Owner: `orchestrator + engineers`

## ADR Mandatory Cases
- `REQUIRES_NEW` transaction use.
- Cross-context synchronous direct call.
- Dependency direction exception.
- Temporary raw `Map<String,Object>` exception.

## Required Fields
- ADR number
- Title
- Status
- Date
- Context
- Decision
- Alternatives considered
- Consequences
- Rollback/expiry date
- References (PR/issues)

## Lifecycle
1. Draft before implementation when possible.
2. Link ADR in PR.
3. Add expiry/review date for temporary exception.
4. Close/replace ADR when decision changes.

## Location
- Store in `docs/decisions/`.
- Naming: `ADR-XXXX-<kebab-title>.md`.
