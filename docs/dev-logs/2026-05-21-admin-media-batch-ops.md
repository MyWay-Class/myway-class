# 2026-05-21 Admin Media Batch Ops

## 요약
- MediaContractTest를 테스트 전용 H2 프로필(`media-contract-test`) + 시드 SQL로 고정해 실DB 영향 제거
- 관리자 미디어 배치 운영 API 추가 (상태 조회, 전체 실행, 실패만 실행)
- 배치 스케줄러 추가 (기본 12시간 간격)
- R2 매핑 감사/일괄 매핑 API 및 운영 스크립트 추가
- 관리자 자동화 화면에 배치 현황/실패 강의/재실행 버튼 연동

## 백엔드
- `GET /api/v1/admin/media/batch/status`
- `POST /api/v1/admin/media/batch/run` (`mode`: `all` | `failed-only`)
- `GET /api/v1/admin/media/r2-mappings/audit`
- `POST /api/v1/admin/media/r2-mappings/bulk-map`

## 프론트
- AdminAutomationPage에 배치 카드 추가
- 성공/실패/대기 카운트, 마지막 실행 시각, 실패 강의 목록 노출
- 전체/실패건만 재실행 및 새로고침 지원

## 운영
- 수동 일괄 매핑: `scripts/backend-r2-bulk-map.ps1`
- 배치 스케줄 튜닝: `myway.media.batch.schedule-ms`

## 검증
- `backend-spring`: `.\mvnw.cmd -q "-Dtest=MediaContractTest,AdminMediaBatchIntegrationTest" test` 통과
- `frontend`: `npm run test -- admin-automation-utils.test.ts` 통과