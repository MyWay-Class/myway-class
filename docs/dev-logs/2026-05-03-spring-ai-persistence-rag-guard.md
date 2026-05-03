# 2026-05-03 Spring AI 사용량 제한/로그 및 RAG 검증 보강

## 요약
- `/api/v1/ai/*` 주요 엔드포인트에 일일 사용량 제한(429) 가드 추가
- AI 요청 성공 시 사용량(`ai_usage_daily`) 및 로그(`ai_log`) 적재
- `/api/v1/ai/rag`에 `query`, `lecture_id|course_id`, 존재 검증 계약 보강
- 통합 테스트(`AdminEndpointMigrationIntegrationTest`, `LegacyEndpointMigrationIntegrationTest`) 보강

## 검증
- `./mvnw.cmd -Dtest=AdminEndpointMigrationIntegrationTest test` 통과
- `./mvnw.cmd test` 전체 통과
