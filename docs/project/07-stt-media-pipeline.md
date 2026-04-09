## STT와 미디어 파이프라인

## 목적
강의 미디어가 어떻게 트랜스크립트, 타임스탬프, 요약 데이터로 바뀌는지 정의한다.

## 선택 이유
- 강의는 원래 음성이어서, 먼저 텍스트로 바꿔야 검색과 요약이 가능하다.
- STT가 있어야 청킹, RAG, 요약, 숏폼 생성이 모두 같은 원문을 볼 수 있다.
- 타임스탬프가 있어야 학습자가 중요한 구간으로 바로 이동할 수 있다.

## 범위
- 트랜스크립트 생성
- 타임스탬프 생성
- 오디오 추출
- 요약 파이프라인

## 입력
- 강의 텍스트 또는 미디어 참조
- 길이 추정값
- 언어 또는 스타일 힌트

## 출력
- 트랜스크립트 구간
- 타임스탬프가 있는 요약
- 추출 메타데이터

## 규칙
- 데모 모드에서는 미디어 추출을 시뮬레이션할 수 있다.
- 큰 파일은 R2에 둔다.
- 파이프라인 상태를 추적해야 한다.
- STT 결과에는 구간 정보와 원문 위치가 함께 남아야 한다.
- 요약은 트랜스크립트가 생성된 이후에만 수행한다.

## 현재 구현
- `POST /api/v1/media/transcribe`로 텍스트 기반 트랜스크립트 또는 `audio_url` 기반 실제 STT 트랜스크립트를 생성한다.
- `POST /api/v1/media/summarize`로 brief, detailed, timeline 요약 노트를 생성한다.
- `POST /api/v1/media/extract-audio`로 오디오 추출 메타데이터를 기록한다.
- `GET /api/v1/media/transcript/:lectureId`, `GET /api/v1/media/notes/:lectureId`, `GET /api/v1/media/audio-extractions/:lectureId`, `GET /api/v1/media/pipeline/:lectureId`로 상태와 산출물을 확인한다.
- 데모 데이터는 `packages/shared/src/media.ts`와 `packages/shared/src/demo-data.ts`에서 관리한다.

## 상태
- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

## 기준값
- 텍스트 전용 강의는 STT 없이 바로 트랜스크립트를 구성할 수 있다.
- 긴 미디어는 R2에 저장하고, 메타데이터만 D1에 둔다.
- 타임스탬프는 학습자가 화면에서 바로 점프할 수 있을 정도로 충분히 촘촘해야 한다.
- 데모 모드와 운영 모드를 상태값으로 구분한다.

## 예외 상황
- 일부 강의는 텍스트만으로 구성된다.
- 일부 트랜스크립트는 기존 텍스트에서 생성될 수 있다.

## 실패 모드
- 실제 추출이 아닌데 실제 추출처럼 표시하는 경우
- 큰 미디어를 D1에 저장하는 경우
- 타임스탬프 정렬이 깨지는 경우

## Provider 계층
- 현재 구현은 `demo` STT를 기본 경로로 유지한다.
- 향후 운영 경로는 `Cloudflare AI -> Gemini -> demo` 순의 fallback 계층을 기본으로 둔다.
- `POST /api/v1/media/transcribe`는 provider 메타데이터를 함께 기록하고, `audio_url`이 주어지면 Cloudflare Workers AI 전사를 먼저 시도한다.
- `GET /api/v1/media/providers`로 provider 계층을 조회할 수 있다.
- STT 결과에는 `stt_provider`, `stt_model`, `segments`, `word_count`가 함께 남아야 한다.

## 검증 기준
- 미디어 내용을 검색 가능한 트랜스크립트 데이터로 바꿀 수 있다.
- 데모 경로와 운영 경로를 구분할 수 있다.
