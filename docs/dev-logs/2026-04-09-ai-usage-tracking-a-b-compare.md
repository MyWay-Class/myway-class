# 2026-04-09 AI 사용 로그 추적 A/B 비교

## 한줄 요약
AI 사용 로그 조회 API를 추가하고, A안은 기존 관리자 통계 화면에 추적 요약과 최근 로그를 붙였으며 B안은 전용 `AI 추적 대시보드` 페이지로 분리했다.

## 구현 내용
- `GET /api/v1/ai/logs`를 추가해 provider, model, 토큰, 지연시간, 성공 여부, 인텐트 로그, 질문/답변 로그를 내려주도록 했다.
- shared에 `AILogOverview`와 집계 타입을 추가해 backend/frontend가 같은 구조를 쓰게 했다.
- A안에서는 `admin-stats` 화면에 AI 요약 카드, provider/model 분포, 최근 사용 로그, 인텐트 로그, 질문/답변 로그를 함께 보여주도록 확장했다.
- B안에서는 `admin-ai-logs` 전용 페이지와 내비게이션을 추가해 운영자가 로그만 집중적으로 볼 수 있게 했다.

## A/B 비교
- A안이 기존 운영 흐름을 깨지 않고 정보를 더하는 방식이라 학습 비용이 낮았다.
- B안은 정보량은 좋았지만 페이지와 내비게이션이 한 단계 더 늘어나 관리 화면이 무거워졌다.
- 최종 선택은 A안이다.

## 검증
- `npm run build:backend` 통과
- `npm run build:frontend`는 Vite의 `spawn EPERM` 환경 오류로 실패

