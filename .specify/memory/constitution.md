# myway-class Constitution

## Core Principles

### I. API Contract First
- 프론트/백엔드 변경은 API 계약을 먼저 정의하고, 구현은 계약을 따라간다.
- `/api/v1/*` 응답 포맷은 `success/data/error/message`를 유지한다.
- 계약 변경 시 프론트 호출부와 타입 정의를 같은 변경 단위로 반영한다.

### II. Migration Safety
- 대체 마이그레이션(Spring 전환 포함)은 단계별로 진행한다.
- 미이식 기능은 `501` 또는 명시적 에러로 숨기지 않고 드러낸다.
- 레거시 경로는 완전 이식 전까지 병행 가능해야 한다.

### III. Verify Before Claim
- 성공/완료 주장은 실행 결과(빌드/테스트/헬스체크) 확인 후에만 한다.
- 환경 제약으로 검증이 불가능하면 이유와 미검증 범위를 명확히 남긴다.

### IV. Role-Based Orchestration
- 오케스트레이터는 작업을 `backend-engineer`, `frontend-engineer`, `qa-integrator`로 분할한다.
- 변경은 책임 경계 기준으로 배분하고, 결과는 통합 시점에 검증한다.

### V. Simplicity and Reversibility
- 우선 동작 가능한 최소 구현으로 시작하고, 이후 저장소/파이프라인 고도화한다.
- 되돌릴 수 없는 대규모 변경은 단일 커밋으로 묶지 않는다.

## Engineering Constraints

- Java 백엔드는 Java 21을 기본 런타임으로 사용한다.
- 인증이 필요한 API는 `Authorization: Bearer` 기반 세션 검증을 적용한다.
- 비밀값/토큰/개인정보는 저장소에 커밋하지 않는다.

## Workflow and Quality Gates

1. `specify/specify-plan/specify-tasks`로 요구사항-계획-작업을 분리한다.
2. 구현은 작업 브랜치에서 진행하고, PR은 `dev` 대상 기준으로 작성한다.
3. PR 본문은 한글 템플릿(개요/변경사항/검증/후속작업)으로 유지한다.
4. QA는 경계면(API-UI) 기준으로 회귀 여부를 확인한다.

## Governance
- 본 문서는 프로젝트 개발 규칙의 최상위 기준이다.
- 예외가 필요하면 PR 본문에 사유와 영향 범위를 기록한다.
- 규칙 변경은 문서 수정 + 변경 이유 + 적용 일자를 함께 남긴다.

**Version**: 1.0.0 | **Ratified**: 2026-04-30 | **Last Amended**: 2026-04-30
