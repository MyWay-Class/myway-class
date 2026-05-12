# Backend Spring Arch Rules

This file mirrors and enforces `docs/architecture/Architecture-Rules.md` for backend contributors.

## Mandatory
- Context package split: `domain.learning|media|rag|shortform|ai`.
- `@Transactional` only in `domain.*.application`.
- New `Map<String,Object>` boundary usage forbidden by default.
- `api -> persistence` direct dependency forbidden.
- Structural exception requires ADR (`docs/decisions/ADR-POLICY.md`).

## Naming
- UseCase: `*UseCase`
- Port: `*Port`
- Adapter: `Jdbc*Repository`/`Http*Gateway`
- Mapper: `*Mapper`
