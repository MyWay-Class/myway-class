# ADR-0002: STT Chunking and Timestamp Strategy

- Status: Accepted
- Date: 2026-05-07
- Owners: Backend / Media Pipeline
- Supersedes: N/A
- Superseded by: N/A

## 배경(Context)
강의 전사(STT) 결과를 RAG/숏폼/학습 UI에서 공통 재사용하려면, 세그먼트 청킹과 타임스탬프 보존 전략이 필요하다.

## 목표(Decision Drivers)
- 전사 정확도
- 처리 비용
- 구현 복잡도
- 타임라인 UX 정합성

## 고려한 대안(Options)
1. 고정 길이 청킹(예: N초 단위)
2. 문장 경계 기반 의미 청킹
3. 하이브리드(시간 상한 + 문장 경계)

## 최종 선택(Decision)
하이브리드 전략 채택:
- 1차: 시간 윈도우 상한으로 세그먼트 분할
- 2차: 문장/구두점 경계 보정
- 3차: `start_ms/end_ms` 원본 타임스탬프를 필드로 보존

## 선택 이유(Rationale)
- 고정 길이만 쓰면 문맥 절단이 잦음
- 의미 청킹만 쓰면 분할 편차가 커져 UI seek 정합성이 떨어짐
- 하이브리드는 정확도/비용/구현 난도를 균형화한다

## 포기한 대안의 이유(Why not)
- 고정 길이 단독: 문맥 손실/응답 근거 품질 저하
- 의미 청킹 단독: 구현 복잡도와 지연 시간 증가

## 결과/영향(Consequences)
- 세그먼트 후처리 단계가 추가됨
- timestamp precision 개선으로 강의 상세/숏폼 편집 연계 품질 향상

## 검증 계획(How we will verify)
- timestamp precision(정답 구간 오차) 측정
- chunk 길이 분포/응답 groundedness 모니터링
- 비용/지연(전사 처리시간, 토큰 사용량) 추적

## 롤백 조건(Rollback Trigger)
- 평균 timestamp 오차가 기준치 초과
- 전사 처리 지연이 SLO를 2주 연속 초과
