# Implementation Plan: Spring Backend Phase 3 Persistence & Pipeline

**Branch**: `feature/spec-phase3-backend-migration` | **Date**: 2026-04-30 | **Spec**: `specs/003-spring-phase3/spec.md`
**Input**: Feature specification from `/specs/003-spring-phase3/spec.md`

## Summary

Spring 2차에서 인메모리로 구현한 `ai/media/shortform/custom-courses` 영역을 durable 저장소 기반으로 전환하고, shortform export 재시도 상태기계를 정식화하며, API 계약 테스트를 도입한다.

## Technical Context

**Language/Version**: Java 21  
**Primary Dependencies**: Spring Boot Web, Spring Validation, (추가) Spring Data JDBC/JPA, Testcontainers or H2 for tests  
**Storage**: Durable SQL storage (우선 H2 + JDBC abstraction, 운영 바인딩 호환)  
**Testing**: JUnit 5 + Spring Boot Test + MockMvc  
**Target Platform**: Windows/Linux JVM runtime  
**Project Type**: Backend web-service  
**Performance Goals**: 주요 조회 API p95 250ms 이하(로컬 기준)  
**Constraints**: 응답 포맷/에러코드 하위호환 유지, 인증 semantics 유지  
**Scale/Scope**: Phase 3 범위는 `ai/media/shortform/custom-courses` + contract tests

## Constitution Check

- API Contract First: 충족 (계약 테스트를 구현 산출물에 포함)
- Migration Safety: 충족 (기존 경로 유지, 저장소만 전환)
- Verify Before Claim: 충족 (테스트 커맨드와 결과 필수)
- Role-Based Orchestration: 충족 (backend 중심, QA 계약 테스트 분리)
- Simplicity/Reversibility: 충족 (단계별 전환, feature toggle 가능)

## Project Structure

### Documentation (this feature)

```text
specs/003-spring-phase3/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend-spring/
├── src/main/java/com/myway/backendspring/
│   ├── api/
│   ├── auth/
│   ├── common/
│   ├── config/
│   ├── domain/
│   └── persistence/        # 신규
└── src/test/java/com/myway/backendspring/
    ├── contract/           # 신규
    └── integration/        # 신규
```

**Structure Decision**: 기존 Spring 구조를 유지하고 persistence/test 레이어를 추가한다.

## Phase 0: Research

- 저장소 선택지 비교: JDBC vs JPA vs MyBatis (단순성/이식성/테스트성 기준)
- shortform export 상태기계 모델링 (`PENDING/PROCESSING/FAILED/FAILED_PERMANENT/COMPLETED`)
- 콜백 idempotency/versioning 전략 정리

## Phase 1: Design

- 데이터 모델 정의 (`MediaJob`, `TranscriptDocument`, `ShortformExportJob`, `AiRuntimeSetting`)
- repository 인터페이스와 서비스 레이어 경계 확정
- 계약 테스트 assertion 표준화

## Phase 2: Implementation

- persistence schema + repository 구현
- 기존 `FeatureStoreService` 호출부를 durable service로 교체
- retry/callback 상태전이 로직 구현
- contract tests + auth regression tests 추가

## Phase 3: Verification

- 단위/통합/계약 테스트 실행
- 핵심 엔드포인트 수동 smoke
- 문서(README/운영노트) 반영

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Durable storage layer 추가 | 인메모리 상태 소실 방지 | 메모리 캐시만으로는 재시작 복구 불가 |
