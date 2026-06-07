# Frontend Refactoring Playbook

Owner: `frontend-engineer`

## State Strategy
- Local UI: `useState` / `useReducer`
- Server state: TanStack Query
- Form state: react-hook-form

## Mandatory Query Key Rule
- Central key registry: `frontend/src/lib/query-keys.ts`
- No inline string keys in hooks/components.

## API Type Pipeline
1. Receive response as `unknown`.
2. Validate with `zod`.
3. Convert to typed model.
4. Expose typed result to UI.

## Forbidden
- New `useEffect + fetch + manual loading` pattern.
- `any` in API pipeline.
- `as X` assertion before schema validation.

## Initial Actions
1. Convert `LectureStudioPage` API loading to Query hooks.
2. Introduce unknown->zod->typed model in `api-*` modules.
3. Replace inline query keys with `queryKeys.*`.
