# 2026-05-24 smoke video asset/playback check

## 요약
- 스모크 테스트에 강의 영상 에셋 경로 검증을 추가했다.

## 변경 내용
- `scripts/smoke-media-ai-shortform.ts`
  - `SMOKE_REQUIRE_PLAYBACK=true` 환경변수 추가 (기본 false).
  - `lecture-video` 응답에서 `asset_key`뿐 아니라 `video_url` 존재 검증 추가.
  - `/api/v1/media/assets/{asset_key}` 메타 조회 검증 추가:
    - `200`이면 asset key 일치 검증.
    - `404`는 허용(매핑은 있으나 media_asset KV 미존재 케이스).
  - `SMOKE_REQUIRE_PLAYBACK=true`일 때에만 바이트 범위 요청(`Range`)으로 실재생 가능 상태(200/206) 강제 검증.

## 검증
- `npm run smoke:media-ai-shortform` 통과.
