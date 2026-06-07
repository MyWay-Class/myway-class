# STT Provider Cloudflare A/B Compare

## Context
- Issue #73 asked for an actual STT provider connection instead of the demo-only transcript path.
- The existing STT layer already had provider selection and fallback metadata, but it still generated transcripts from shared demo logic.

## A안
- Add a Cloudflare Workers AI transcription client in `backend/src/lib/providers/cloudflare.ts`.
- Extend `TranscriptCreateRequest` with `audio_url`, `segments`, and `word_count`.
- Let `backend/src/lib/stt-adapter.ts` call the real provider when `audio_url` is present and `cloudflare` is selected.
- Keep the existing shared demo path as fallback when provider access fails or no audio input is available.

## B안
- Push more of the transcription shape into shared helpers and redesign the transcript creation flow around a broader shared refactor.
- This would spread the change across more files and make the first STT provider connection slower to verify.

## Decision
- A안을 선택했다.
- 이유는 변경 파일 수가 더 적고, 기존 demo fallback을 유지한 채 실제 provider 연결만 추가할 수 있기 때문이다.
- `audio_url`이 있는 경우에만 Workers AI 전사를 시도하므로, 기존 텍스트 기반 흐름과 충돌하지 않는다.

## Validation
- `npm run build:backend` 통과

## Follow-up
- `docs/project/07-stt-media-pipeline.md`
- `docs/project/15-api-map.md`
- `docs/project/20-status-and-next-steps.md`
