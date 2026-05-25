# 2026-05-25 STT 승인 실행 API 추가

## 배경
- callback의 `approval/pending` 모드는 자동 시작을 보류하지만, 운영자가 승인 후 재시작하는 실행 경로가 필요했다.

## 변경
- `POST /api/v1/media/extract-audio/{extractionId}/approve-stt` 추가
  - 권한: 강사/운영자
  - 입력: `lecture_id` (필수), optional `language`, `duration_ms`, `stt_provider`, `stt_model`
  - 동작: pending approval extraction을 찾아 STT 실행
  - 응답: transcript, pipeline, stt_sync_policy(decision=`started_by_approval`)
- `MediaContractTest`에 승인 실행 계약 테스트 추가

## 검증
- `npx tsx scripts/run-maven-wrapper.ts "-Dtest=MediaContractTest" test` 통과
- `npm run verify` 통과
