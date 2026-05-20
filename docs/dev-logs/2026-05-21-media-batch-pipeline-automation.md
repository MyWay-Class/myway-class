# 2026-05-21 Media Batch Pipeline Automation

## 변경 요약
- 관리자 전용 배치 엔드포인트 `POST /api/v1/media/pipeline/run-batch`를 추가했다.
- 매핑된 강의를 대상으로 `extract-audio -> transcribe -> rag index`를 순차 실행하도록 구현했다.
- `retry_count` 옵션 기반 재시도와 `success/failed/pending` 집계 응답을 추가했다.

## 핵심 정책
- 기존 인증 정책 유지: 비로그인 401.
- 관리자 전용 정책 적용: 운영자(admin)만 배치 실행 가능, 강사(instructor)는 403.
- 기존 개별 엔드포인트 동작은 유지하고 배치 기능을 서비스 계층에 추가했다.

## 검증
- `mvn -DskipTests compile` 성공.
- `MediaContractTest`는 현재 로컬 DB 초기화 스크립트 이슈로 컨텍스트 기동 실패(기존 환경 이슈) 확인.
- 배치 엔드포인트 계약 검증 테스트를 추가해 권한/응답 집계 필드를 검증하도록 반영했다.
