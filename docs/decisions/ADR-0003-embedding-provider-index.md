# ADR-0003: Embedding Provider and Index Store

- Status: Proposed
- Date: 2026-05-07
- Owners: Backend / Infra
- Supersedes: N/A
- Superseded by: N/A

## 배경(Context)
RAG 품질 고도화를 위해 임베딩 모델과 벡터 인덱스 저장소 조합을 표준화해야 한다.

## 목표(Decision Drivers)
- 조회 성능(지연/처리량)
- 운영비
- 벤더 락인 리스크
- 로컬 개발/테스트 용이성

## 고려한 대안(Options)
1. D1 + 외부 벡터DB
2. PostgreSQL + pgvector
3. 키워드 전용(벡터 미사용)

## 최종 선택(Decision)
현 단계에서는 `PostgreSQL + pgvector`를 1순위 채택안으로 제안한다.

## 선택 이유(Rationale)
- SQL 기반 운영/관측/백업 체계 통합이 쉽다
- 로컬 개발 환경 재현성이 높다
- 데이터 이관/분석 파이프라인 연계가 단순하다

## 포기한 대안의 이유(Why not)
- D1 + 외부 벡터DB: 멀티 서비스 운영복잡도와 네트워크 비용 증가
- 키워드 전용: 의미 유사 검색 한계로 품질 상한이 낮다

## 결과/영향(Consequences)
- DB 자원 계획(인덱스/스토리지) 필요
- 스키마/마이그레이션과 임베딩 재색인 운영 절차 필요

## 검증 계획(How we will verify)
- 성능: p95 retrieval latency, QPS
- 비용: 월 저장/쿼리 비용
- 품질: Hit@K/MRR/groundedness
- 운영: 장애 대응 시간, 로컬 재현성

## 롤백 조건(Rollback Trigger)
- pgvector 환경에서 목표 latency/cost 미달
- 운영 복잡도 또는 장애 빈도가 기준 초과 시 D1+외부 벡터DB 재검토
