# 2026-05-24 smoke playback input wiring

## 요약
- `smoke-media-ai-shortform` GitHub Actions에 엄격 재생 검증 토글(`require_playback`)을 연결했다.

## 변경 내용
- `.github/workflows/smoke-media-ai-shortform.yml`
  - `workflow_dispatch` 입력에 `require_playback`(boolean) 추가.
  - 실행 env에 `SMOKE_REQUIRE_PLAYBACK` 주입:
    - 우선순위: `inputs.require_playback` -> `vars.SMOKE_REQUIRE_PLAYBACK` -> `false`.
- `scripts/smoke-media-ai-shortform.ts`
  - 시작 로그에 `requirePlayback` 모드 출력 추가.

## 운영 효과
- 기본 스케줄은 기존처럼 안정 모드(`false`)로 유지.
- 수동 실행 시 재생 엄격 모드(`true`)로 즉시 전환 가능.

## 검증
- 로컬 `npm run smoke:media-ai-shortform` 통과.
