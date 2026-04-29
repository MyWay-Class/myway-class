---
name: myway-class-orchestrator
description: "myway-class에서 기능 개발, 버그 수정, 리팩터링, API-UI 동기화, QA 검증, 다시 실행, 재실행, 업데이트, 보완, 이전 결과 기반 개선 요청이 나오면 반드시 이 스킬을 사용한다. 부분 수정 요청도 이 스킬로 처리한다."
---

# Myway-Class Orchestrator

## Phase 0: Context Check
1. Check `_workspace/` existence.
2. If `_workspace/` exists and request is partial fix, run partial rerun mode.
3. If `_workspace/` exists and request is new input, move prior artifacts to `_workspace_prev/` then start fresh.
4. If `_workspace/` does not exist, run initial mode.

## Phase 1: Scope Split
1. Map request to backend (`backend/src`), frontend (`frontend/src`), shared (`packages/shared`) scopes.
2. Define dependency order for contract-sensitive changes.

## Phase 2: Delegation
1. Delegate API/domain work to `backend-engineer`.
2. Delegate UI/integration work to `frontend-engineer`.
3. Delegate boundary verification to `qa-integrator`.

## Phase 3: Verification
1. Run relevant build/tests.
2. Retry failed verification once.
3. Report unresolved gaps with explicit scope.

## Error Policy
- Do not hide missing validation.
- Keep partial successful outputs, and clearly label blocked areas.

## Trigger Validation
Read `references/trigger-tests.md` to evaluate should-trigger and should-not-trigger phrases.

## 테스트 시나리오
### 정상 흐름
- "frontend 수강 화면에 API 데이터 연결해줘"

### 에러 흐름
- "backend 응답키 바꿨는데 화면이 깨졌어" 요청에서 API shape mismatch를 찾고 재작업 지시
