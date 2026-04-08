# 2026-04-08 Rebase Pull Policy

## 문서 유형
기록입니다. `git pull`에서 merge 커밋이 쌓이지 않도록 rebase 기준을 저장소 규칙과 로컬 설정에 반영했습니다.

## 변경 이유
- `git pull`을 merge 방식으로 쓰면 불필요한 병합 커밋이 쌓인다.
- 작업 히스토리는 rebase 기준으로 더 평평하게 유지하는 편이 읽기 쉽다.
- 저장소 규칙과 실제 작업 방식이 어긋나지 않게 맞춰야 한다.

## 변경 내용
- `agent.md`에 pull/rebase 규칙을 추가했다.
- `docs/ai-context/agent.md`에 merge pull 금지와 rebase 우선 원칙을 추가했다.
- `docs/ops/agent/agent.md`에 빠른 체크 항목을 추가했다.
- 로컬 repo 설정에 `pull.rebase=true`, `rebase.autoStash=true`를 적용했다.

## 검증
- 로컬 설정 반영을 확인했다.
- 문서 기준상 merge pull 대신 rebase를 기본값으로 두는 방향으로 정리했다.
