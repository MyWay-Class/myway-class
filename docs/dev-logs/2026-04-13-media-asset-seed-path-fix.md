# 2026-04-13 Media Asset Seed Path Fix

## 변경 요약
- AI 강의 비디오 경로를 `crs_ai_001`에서 `crs_ai_seed_001`로 통일했다.
- `packages/shared/src/data/courses.ts`와 `packages/shared/src/data/media.ts`의 `video_url`, `video_asset_key`, `source_url`, `audio_url`을 seed 경로로 수정했다.
- backend dev server가 seed 경로를 그대로 넣고 조회할 수 있도록 alias 처리를 유지했고, 내장 demo video bytes를 fallback으로 사용하게 해서 로컬 파일 의존도도 낮췄다.

## 검증
- `npm --workspace @myway/backend run build` 통과
- backend dev server foreground 실행에서 `Seeded ... demo lecture video assets`와 `Backend dev server listening on http://127.0.0.1:8787` 확인

## 메모
- 실제 버킷에 이미 올라간 seed 경로를 코드 기준으로 채택했다.
- 현재 프론트는 `http://localhost:5173`에서 동작 중이다.
