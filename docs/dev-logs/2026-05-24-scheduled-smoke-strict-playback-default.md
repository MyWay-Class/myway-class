# 2026-05-24 scheduled smoke strict playback default

## 요약
- 스케줄 smoke 실행의 기본 재생 검증 모드를 strict(`SMOKE_REQUIRE_PLAYBACK=true`)로 상향했다.

## 변경 내용
- `.github/workflows/smoke-media-ai-shortform.yml`
  - `SMOKE_REQUIRE_PLAYBACK` 계산식 개선:
    - 우선순위: `workflow_dispatch input` -> `repo var` -> `(schedule면 true)` -> `false`.
- `scripts/smoke-media-ai-shortform.ts`
  - strict 재생 프로브 실패 시 진단 정보 추가 출력:
    - status
    - content-type
    - content-range
    - `x-error-code`
    - `x-error-message`

## 운영 효과
- 정기 스모크에서 실제 재생 가능성(200/206)을 기본 게이트로 확인 가능.
- 실패 시 원인 파악 속도 향상.

## 검증
- `npm run smoke:media-ai-shortform` 통과 (`requirePlayback=false` 로컬 기본).
