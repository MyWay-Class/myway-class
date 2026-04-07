# 2026-04-06 PR 로그

## 변경 요약
- PR마다 변경 요약을 `docs/dev-logs/`에 남기도록 문서와 템플릿을 정리했다.

## 왜 바꿨는지
- PR이 머지된 뒤에도 어떤 변경이 들어갔는지 빠르게 추적해야 했다.
- 작업 흐름과 PR 템플릿에서 같은 기준을 보이게 해야 했다.

## 무엇을 바꿨는지
- `docs/dev-logs/README.md`에 PR 변경 요약 기록 원칙과 최신 로그 링크를 추가했다.
- AI 작업 흐름 문서에 PR 전/후 로그 기록 단계를 추가했다.
- `.github/pull_request_template.md`와 `.github/MERGE_REQUEST_TEMPLATE.md`에 `docs/dev-logs/` 체크를 추가했다.
- `agent.md`에 PR 전 로그 기록 규칙을 추가했다.

## 어떻게 검증했는지
- 문서 색인과 PR 템플릿을 확인했다.
- 루트 `agent.md`가 200줄 이하인지 확인했다.
- 변경 내용이 `dev-logs`와 PR 템플릿에 동시에 반영됐는지 확인했다.
