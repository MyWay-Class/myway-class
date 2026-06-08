# CI/PR 검증 표준화

## 날짜
- 2026-06-08

## 범위
- `.github/pull_request_template.md`
- `.github/workflows/e2e-demo-student.yml`
- `.github/workflows/smoke-media-ai-shortform.yml`
- `docs/conventions/09-GITHUB-ACTION-CHECKS.md`
- `docs/project/11-testing-and-verification.md`

## 요약
- PR 본문에 검증 명령, 결과, 실패 링크를 적는 규칙을 명시했다.
- `verify-workspace`, `backend-spring-tests`, `e2e-demo-student`, `orchestration-gate`를 기본 검증 축으로 문서화했다.
- AI/Media/STT/Shortform 변경 시 `smoke-media-ai-shortform`을 추가 검증으로 고정했다.
- `e2e-demo-student`와 `smoke-media-ai-shortform`에 concurrency를 추가해 중복 실행을 줄였다.

## 확인 포인트
- 검증 증적이 PR 본문에서 추적 가능해야 한다.
- timeout과 concurrency 기준이 문서와 workflow에 동시에 반영돼야 한다.
- AI/Media 계열 변경은 smoke 체크를 별도 항목으로 남겨야 한다.
