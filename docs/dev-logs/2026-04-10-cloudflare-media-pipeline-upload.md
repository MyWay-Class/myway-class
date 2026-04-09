# Cloudflare Media Pipeline Upload

## 왜 바꿨나
- 강의 영상 업로드가 필요한데, 기존 `extract-audio`는 메타데이터 기록만 해서 실제 업로드와 파이프라인 연결이 끊겨 있었다.
- Cloudflare 기준으로는 R2 업로드, asset 조회, STT 전사를 한 흐름으로 보여주는 화면이 필요했다.

## 무엇을 바꿨나
- 백엔드에 `POST /api/v1/media/upload-video`를 추가해 강의 영상을 R2에 저장할 수 있게 했다.
- `GET /api/v1/media/assets/:assetKey`를 추가해 업로드된 영상을 다시 읽을 수 있게 했다.
- `POST /api/v1/media/extract-audio`를 job 생성 흐름으로 정리하고, `audio_url`이 있으면 전사까지 이어지게 했다.
- 프론트에 미디어 파이프라인 페이지와 상태 보드를 추가했다.
- 문서에 업로드/asset 조회/API 맵/상태 요약을 반영했다.

## 어떻게 검증했나
- `npm run build:backend` 통과
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit` 통과
