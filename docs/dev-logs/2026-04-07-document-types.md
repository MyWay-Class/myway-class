# 2026-04-07 문서 유형 명시

## 변경 이유
- 문서마다 원본, 요약, 기록, 허브 역할을 첫 줄에서 바로 보이게 하려 했다.
- 중복 위험을 줄이기 위해 각 문서의 책임을 상단에서 명시하려 했다.

## 변경 내용
- 루트 `README.md`, `agent.md`, `docs/README.md`, `docs/project/00-index.md`에 문서 유형을 추가했다.
- `docs/context/README.md`, `docs/conventions/README.md`, `docs/structure/README.md`, `docs/ai-context/agent.md`, `docs/dev-logs/README.md`, `docs/ops/agent/agent.md`에 각각의 문서 역할을 적었다.

## 검증 상태
- 각 문서의 상단에서 역할을 바로 읽을 수 있다.
- 원본, 요약, 기록, 허브의 경계가 이전보다 분명해졌다.
