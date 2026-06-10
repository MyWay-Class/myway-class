# RAG Flow

## 시스템 흐름
1. STT: 강의 오디오를 전사하고 `TranscriptChunk` 생성
2. Persist: chunk를 lecture 단위 canonical source로 저장
3. SearchIndex: 검색용 인덱스를 chunk에서 파생
4. Retrieve: 질의 기준으로 후보 chunk를 찾고 timestamp citation을 유지
5. TimelineProject: 사용자가 선택한 chunk를 숏폼 편집 계획으로 조합
6. AnswerPolicy: 애매한 발화, 낮은 신뢰도, 상담사 전환 기준을 판정
7. Answer: 상위 근거 chunk와 policy를 바탕으로 grounded answer 생성

## 실패/폴백 시나리오
- STT 실패: 재시도 후 demo/fallback transcript 경로 사용, 파이프라인 상태 `FAILED` 기록
- Embedding 실패: 키워드 검색만으로 degraded mode 응답
- Vector store 장애: 키워드 인덱스 단독 모드 전환
- Rerank 실패: retrieve score 순으로 응답
- Answer 생성 실패: 검색 결과/요약만 반환
- Policy 미달: 답변 대신 재질문 또는 찾지 못했다는 응답으로 전환

## 운영 포인트
- 각 단계별 상태를 `processing_stage`, `status`, `updated_at`로 기록
- 장애 시 단계별 재처리 가능하도록 idempotent key 유지
- 검색과 편집은 같은 chunk를 보되 서로 다른 레이어에서만 해석한다.
