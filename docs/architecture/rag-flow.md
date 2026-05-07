# RAG Flow

## 시스템 흐름
1. STT: 강의 오디오를 전사하고 `segment(start_ms, end_ms, text)` 생성
2. Chunk: 문장 경계 보정으로 검색 단위 chunk 생성
3. Index: 키워드 인덱스 + 벡터 인덱스 저장
4. Retrieve: 질의 기준으로 키워드/벡터 후보를 병렬 수집
5. Rerank: 메타데이터(강의/코스/시간축)와 관련도로 재정렬
6. Answer: 상위 근거 chunk를 사용해 grounded answer 생성

## 실패/폴백 시나리오
- STT 실패: 재시도 후 demo/fallback transcript 경로 사용, 파이프라인 상태 `FAILED` 기록
- Embedding 실패: 키워드 검색만으로 degraded mode 응답
- Vector store 장애: 키워드 인덱스 단독 모드 전환
- Rerank 실패: retrieve score 순으로 응답
- Answer 생성 실패: 검색 결과/요약만 반환

## 운영 포인트
- 각 단계별 상태를 `processing_stage`, `status`, `updated_at`로 기록
- 장애 시 단계별 재처리 가능하도록 idempotent key 유지
