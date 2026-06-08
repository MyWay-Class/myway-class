# GitHub Action 체크 규칙

## 목적
브랜치 보호 규칙과 연결할 검증 체크 이름을 정한다.

## 체크 이름
- `repo-structure`
- `docs-integrity`
- `utf8-check`
- `ci-checks`
- `cd-checks`

## 필수 워크플로우
- `verify-workspace`
- `backend-spring-tests`
- `e2e-demo-student`
- `orchestration-gate`
- `smoke-media-ai-shortform` (AI/Media/STT/Shortform 범위 변경 시)

## 역할
- `repo-structure`: 필수 폴더와 패키지 이름이 프로젝트 기준과 맞는지 확인한다.
- `docs-integrity`: 메인 에이전트 가이드 길이, 핵심 문서 존재 여부, JavaScript 앱 파일 금지를 확인한다.
- `utf8-check`: 저장소의 텍스트 파일이 UTF-8인지 확인한다.
- `ci-checks`: 기본 CI 준비 상태를 확인한다.
- `cd-checks`: 배포 준비 상태를 확인한다.
- `verify-workspace`: workspace 검증 명령(`npm run verify`)과 계약/통합 테스트를 묶어서 확인한다.
- `backend-spring-tests`: Spring backend 계약과 통합 테스트를 고정된 timeout 안에서 실행한다.
- `e2e-demo-student`: 대표 사용자 시나리오를 E2E로 검증한다.
- `orchestration-gate`: 오케스트레이션 의사결정이 승인 상태인지 확인한다.
- `smoke-media-ai-shortform`: 미디어/STT/숏폼 callback과 공개 테스트 흐름을 사전 점검한다.

## 브랜치 보호 연결
- `main` 브랜치는 위 다섯 체크가 모두 통과해야 병합할 수 있다.
- `dev` 브랜치도 필요 시 같은 체크를 적용한다.
- PR은 최소한 `verify-workspace`, `backend-spring-tests`, `e2e-demo-student`, `orchestration-gate`를 기준 검증으로 삼는다.
- AI/Media/STT/Shortform 변경은 `smoke-media-ai-shortform`을 추가 검증으로 삼는다.

## timeout/concurrency 기준
- 워크플로우는 가능하면 `concurrency`를 설정하고 `cancel-in-progress: true`를 사용한다.
- 기본 timeout은 `10~30분` 사이에서 잡고, E2E나 스모크처럼 외부 준비가 필요한 작업은 더 넉넉히 둔다.
- `verify-workspace`와 `orchestration-gate`는 PR 중복 실행이 많으므로 concurrency 기준을 반드시 둔다.

## 검증 기준
- 브랜치 보호 설정에서 체크 이름을 그대로 선택할 수 있다.
- 체크만 봐도 저장소 구조와 문서 상태를 확인할 수 있다.
