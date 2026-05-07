# RAG Quality Metrics

## 지표 정의
- Hit@K: 정답 근거가 상위 K개 후보에 포함되는 비율
- MRR: 정답 근거의 역순위 평균
- Groundedness: 답변 문장이 실제 근거 chunk에 의해 지지되는 비율
- Timestamp Precision: 답변/하이라이트가 참조한 시간 구간 오차(ms)

## 측정 방법
- 평가셋: 강의별 질의-정답근거 샘플셋 유지
- 오프라인: 배치 평가로 Hit@K, MRR 산출
- 온라인: 샘플링된 요청에 groundedness/timestamp precision 주기 측정
- 회귀: 배포 전 baseline 대비 편차 확인

## Baseline (초기)
- Hit@5: 0.70 이상
- MRR: 0.55 이상
- Groundedness: 0.80 이상
- Timestamp Precision: 평균 절대 오차 2,000ms 이하

## 운영 기준
- 2주 연속 baseline 미달 시 ADR 재검토
- 지표 악화 시 retrieve/rerank 파라미터 롤백 우선
