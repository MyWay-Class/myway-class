# STT Provider Adapter

## 배경
- 이슈 #44에서는 미디어 파이프라인이 demo 트랜스크립트 생성에만 머무르지 않도록 provider 계층을 먼저 정리했다.
- STT 결과와 파이프라인 상태는 이후 청킹, RAG, 요약, 숏폼 연결의 입력이 되므로 실행 계층이 필요했다.

## 변경 내용
- `packages/shared/src/stt-provider.ts`를 추가해 STT provider 이름, 기능 범위, fallback 순서를 공통 타입으로 정리했다.
- `backend/src/lib/stt-provider.ts`와 `backend/src/lib/stt-adapter.ts`를 추가해 transcript 생성 시 provider 선택을 분리했다.
- `backend/src/routes/media.ts`가 adapter를 통해 트랜스크립트를 생성하고, `GET /api/v1/media/providers`로 provider 계층을 조회할 수 있게 했다.
- `packages/shared/src/media.ts`는 transcript 메타데이터에 `stt_provider`와 `stt_model`을 기록하도록 정리했다.
- `docs/project/07-stt-media-pipeline.md`, `docs/project/15-api-map.md`를 업데이트했다.

## 검증 포인트
- STT provider fallback은 `Cloudflare AI -> Gemini -> demo`를 기본으로 둔다.
- 텍스트 전용 트랜스크립트도 provider 메타데이터를 함께 남긴다.
- 파이프라인 조회 API는 기존 응답 구조를 유지한다.
