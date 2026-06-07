# 2026-04-09 대시보드 활동 타임라인과 학습 통계

## 한줄 요약
대시보드에 최근 활동 타임라인과 역할별 학습 통계를 추가해서 학습 흐름과 운영 현황을 더 빠르게 읽을 수 있게 했다.

## 구현 내용
- `Dashboard` 타입에 `stats`, `recent_activities`, `next_action`을 추가했다.
- enrollment와 lecture progress에 타임스탬프를 넣어 최근 활동을 실제 이벤트 순서로 정렬할 수 있게 했다.
- shared dashboard 계산 로직에서 학생, 강사, 운영자 역할별 통계와 활동 목록을 구성했다.
- 학생, 강사, 운영자 대시보드에 통계 카드와 최근 활동 타임라인을 추가했다.
- 공통 렌더링을 위해 dashboard stats/timeline 컴포넌트를 분리했다.

## 검증
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit` 통과
- `npm run build:backend` 통과
- `npm install --workspace @myway/backend`로 누락된 `@cloudflare/workers-types` 의존성을 복구했다.

