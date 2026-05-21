# STT Provider Cloudflare Available

## 왜 바꿨나
- Workers AI 기반 STT가 실제 전사 경로로 동작하는데도, provider 카탈로그와 일부 문서가 `planned`처럼 보여서 상태를 맞출 필요가 있었다.
- 배포 시 `AI` binding만 있으면 되는 구조라, 별도 API 키보다 Cloudflare binding과 fallback 문서 정리가 더 중요했다.

## 무엇을 바꿨나
- `packages/shared/src/ai/stt-provider.ts`에서 Cloudflare STT 상태를 `available`로 바꿨다.
- `docs/project/07-stt-media-pipeline.md`의 provider 설명을 실제 동작 기준으로 정리했다.
- `docs/project/14-ai-layer.md`에 `audio_url` 기반 Cloudflare 전사 우선 경로를 명시했다.

## 어떻게 검증했나
- 코드상 `backend/src/lib/providers/cloudflare.ts`가 `env.AI.run(...)`으로 실제 Workers AI 전사를 수행하는지 확인했다.
- `backend/src/routes/media.ts`가 `audio_url`이 있을 때 실제 전사 결과를 `runTranscriptGeneration`으로 전달하는지 확인했다.
