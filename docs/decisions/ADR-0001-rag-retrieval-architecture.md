# ADR-0001: RAG Retrieval Architecture

- Status: Accepted
- Date: 2026-05-07
- Owners: Backend / AI Layer

## 배경(Context)
현재 LMS AI 질의응답은 강의 STT/노트 기반 검색이 필요하며, 응답 groundedness와 운영비를 동시에 맞춰야 한다.

## 목표(Decision Drivers)
- 강의 근거 기반 답변 품질 확보
- 로컬/개발 환경 재현성
- 운영비/복잡도 균형
- 장애 시 폴백 가능성

## 고려한 대안(Options)
1. 키워드 검색(BM25/TF-IDF 계열)
2. 벡터 검색(임베딩 + ANN)
3. 하이브리드(키워드 + 벡터 + 재랭킹)

## 최종 선택(Decision)
하이브리드 검색을 기본 구조로 채택한다.
- 1차 후보: 키워드 + 벡터 병렬 수집
- 2차 정제: 재랭킹(질의 의도/메타데이터/시간축 가중치)
- 3차 생성: 근거 chunk 기반 답변

## 선택 이유(Rationale)
- 키워드는 정확한 용어/고유명사에 강함
- 벡터는 의미 유사 질의에 강함
- 하이브리드는 둘의 약점을 상호 보완하며 회귀 리스크가 낮다

## 포기한 대안의 이유(Why not)
- 키워드 단독: 의미 확장 질의 재현율 저하
- 벡터 단독: 용어 정밀도/운영 디버깅 난이도 증가

## 결과/영향(Consequences)
- 인덱싱/조회 경로가 복합화되어 구현량 증가
- 품질 튜닝 레버(가중치, 필터, rerank)가 늘어 운영 유연성 확보

## 검증 계획(How we will verify)
- `docs/evaluation/rag-quality-metrics.md` 기준으로 Hit@K, MRR, groundedness 주간 측정
- 회귀 시 키워드/벡터/하이브리드 A/B 로그 비교

## 롤백 조건(Rollback Trigger)
- 하이브리드 대비 키워드 단독이 비용/지연/품질에서 2주 연속 우세
- 벡터 인프라 장애로 서비스 가용성 하락 시 키워드 우선 모드로 즉시 전환
