# 2026-05-23 STT Speaker Review + RAG Enrichment

## 배경
- 강의 STT 결과에 화자 정보가 있어도 RAG 인덱스/조회 경로에서 일관되게 노출되지 않는 문제가 있었다.
- 운영자가 강사 화자를 확정하는 검수 워크플로우가 필요했다.

## 변경 내용
- `MediaTranscriptionService`
  - 트랜스크립트 생성 시 `speaker_segments`, `instructor_guess`, `speaker_review` 포함.
- `MediaPipelineService`
  - `speaker_review` 저장/조회 로직 추가.
- `MediaController`
  - `GET/POST /api/v1/media/transcript/{lectureId}/speaker-review` 추가.
- `KeywordRagRetriever`
  - 트랜스크립트 chunk 생성 시 `speaker_label`, `start_ms`, `end_ms` 매핑.
  - `excerpt/content`에 `[SPEAKER_xx]` prefix 반영.
  - 인덱스 재사용 시에도 화자 메타 재보강.
  - RAG 인덱스 rebuild 경로에서 기존 인덱스 재사용 대신 fresh corpus 생성 강제.

## 검증
- `backend-spring`: `./mvnw -q -DskipTests compile` 통과
- API 확인:
  - `POST /api/v1/ai/rag/index/rebuild`
  - `POST /api/v1/ai/rag`
  - 응답 chunk에 `speaker_label/start_ms/end_ms` 및 `[SPEAKER_xx]` prefix 확인

## 리스크/롤백
- 리스크: 기존 인덱스 데이터와 신 스키마 혼용 시 응답 형태 차이 가능.
- 롤백: 해당 커밋 revert 후 인덱스 재생성(`rag/index/rebuild`)로 복구 가능.
