# 2026-04-07 문서 정비 반영

## 변경 이유
- LLM 작업 지시를 짧게 두고, 컨벤션은 별도 문서로 분리하는 원칙을 현재 문서 체계에 맞게 더 분명히 하려 했다.
- 워킹트리 비교, API/보안/DB 검증 기준을 문서에 직접 남겨서 작업 기준을 쉽게 찾게 하려 했다.

## 변경 내용
- `docs/ai-context/agent.md`에 지시 가중치 원칙과 다답안 비교 기준을 추가했다.
- `docs/conventions/00-CONVENTIONS-CORE.md`에 작업 지시 형식과 채택 이유 기록 규칙을 추가했다.
- `docs/conventions/07-WORKTREE-CONVENTIONS.md`에 다답안 비교 섹션을 추가했다.
- `docs/conventions/08-LLM-CLI-TERMINAL.md`에 작업 지시 형식과 참조 방식 규칙을 추가했다.
- `docs/conventions/14-REACT-API-INTEGRATION.md`, `docs/conventions/18-DATABASE-CONVENTIONS.md`, `docs/conventions/20-SECURITY-CONVENTIONS.md`에 검증 기준을 보강했다.
- `docs/structure/backend/common/overview.md`를 `packages/shared`의 실제 타입과 맞췄다.
- `docs/README.md`와 `docs/dev-logs/README.md`에 새 참조 경로를 반영했다.

## 검증 상태
- 현재 저장소의 `packages/shared/src/index.ts`와 `overview.md`의 `ApiResponse` 필드가 일치한다.
- 관련 문서 간 참조가 끊기지 않도록 `docs/README.md`와 `docs/dev-logs/README.md`를 함께 갱신했다.
