# 2026-05-25 STT 메타 동기화 정책 고도화

## 배경
- callback 기반 STT 자동 시작이 단일 경로(auto) 중심이라 승인 기반 운영과 기존 transcript 보호 정책을 세밀하게 제어하기 어려웠다.
- 동시에 AI quota 계약(429)과 dashboard activity 조회 SQL 호환성 회귀가 있어 verify 통과를 막고 있었다.

## 변경
- `/api/v1/media/extract-audio/callback`에 STT 동기화 정책 필드 추가:
  - `sync_mode`: `auto | approval`
  - `overwrite_policy`: `overwrite | skip_if_exists`
  - `approval_state`: `approved | pending`
  - `notification_channel`
- 정책 판단 결과를 응답에 추가:
  - `stt_sync_policy`
  - `stt_sync_metrics`
- extraction 메타에 동기화 정책/알림/지표 스냅샷 저장.
- `FeatureJdbcStore.listActivityEvents`를 동적 SQL로 변경해 H2/Postgres 동시 호환 확보.
- AI quota 윈도우 카운터(`ai_usage_window`)를 도입해 `daily_limit` 계약 테스트의 재현성 확보.

## 검증
- `node scripts/run-maven-wrapper.mjs "-Dtest=MediaContractTest" test` 통과
- `node scripts/run-maven-wrapper.mjs "-Dtest=AiContractTest,DashboardContractTest" test` 통과
- `npm run verify` 통과
