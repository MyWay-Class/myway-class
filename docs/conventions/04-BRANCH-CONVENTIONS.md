# 브랜치 규칙

## 목적
브랜치 이름과 분기 기준을 일정하게 유지한다.

## 규칙
- 기본 브랜치에서 바로 작업하지 않는다.
- 작업은 항상 목적이 드러나는 브랜치에서 시작한다.
- 브랜치명은 영어 소문자와 하이픈을 사용한다.
- 브랜치명은 짧고 의미가 보여야 한다.
- 브랜치명은 `feat/`, `docs/`, `fix/`, `refactor/`, `hotfix/` 중 하나로 시작한다.
- 한 브랜치에는 하나의 작업만 담는다.

## 브랜치 보호 규칙

### `main` 브랜치
- Pull Request 없이는 병합하지 않는다.
- 승인자는 최소 1명이어야 한다.
- 새 커밋이 들어오면 이전 승인 상태는 무효화한다.
- 가장 최근의 리뷰 가능한 푸시에 대한 승인도 필요하다.
- 상태 체크가 모두 통과해야 병합할 수 있다.
- 병합 전에 브랜치가 최신 상태여야 한다.
- 대화 해결이 완료되지 않으면 병합할 수 없다.
- 위 규칙은 관리자에게도 우회 허용하지 않는다.
- `main`으로 직접 push할 수 있는 사람은 저장소 관리자만 허용한다.
- 보호 규칙에 연결할 체크는 `repo-structure`, `docs-integrity`, `utf8-check`, `ci-checks`, `cd-checks`를 기본으로 사용한다.

### `dev` 브랜치
- Pull Request 없이는 병합하지 않는다.
- 승인자는 최소 1명이어야 한다.
- 상태 체크가 모두 통과해야 병합할 수 있다.
- 병합 전에 브랜치가 최신 상태여야 한다.
- 대화 해결이 완료되지 않으면 병합할 수 없다.
- 필요 시 `repo-structure`, `docs-integrity`, `utf8-check`, `ci-checks`, `cd-checks`를 동일하게 적용한다.

## 권장 형식
- 기능: `feat/{issue}-{description}`
- 버그: `fix/{issue}-{description}`
- 리팩토링: `refactor/{issue}-{description}`
- 문서: `docs/{issue}-{description}`
- 긴급 수정: `hotfix/{issue}-{description}`

## 브랜치 템플릿
- 새 기능 작업: `feat/123-user-login`
- 버그 수정: `fix/456-auth-error`
- 리팩토링: `refactor/789-split-service`
- 문서 작업: `docs/101-api-docs`
- 긴급 수정: `hotfix/999-critical-bug`

## 머지 전략
- `feat/*` → `dev`: Squash and merge
- `fix/*` → `dev`: Squash and merge
- `dev` → `main`: Merge commit
- `hotfix/*` → `main`: Merge commit

## 금지
- 의미 없는 숫자 나열 브랜치
- 한 브랜치에 여러 작업을 섞는 것
- 목적이 드러나지 않는 임시 브랜치

## 검증 기준
- 브랜치명만 봐도 작업 목적이 보인다.
- 한 브랜치에 한 가지 목적만 담긴다.
