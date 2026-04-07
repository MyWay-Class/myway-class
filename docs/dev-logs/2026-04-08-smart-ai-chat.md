# 2026-04-08 Smart AI Chat

## 변경 이유
- AI core의 개별 엔드포인트를 하나의 대화형 진입점으로 묶어, 강의/코스 페이지에서 바로 질문할 수 있게 만들었다.
- 참고 저장소의 `smart.ts`처럼 의도 분류 기반 라우팅을 도입해 사용 흐름을 단순화했다.

## 변경 내용
- `backend/src/routes/smart.ts`를 추가했다.
- `packages/shared/src/smart.ts`와 관련 타입을 추가했다.
- `docs/project/04-api-contract.md`, `docs/project/14-ai-layer.md`, `docs/project/15-api-map.md`, `docs/project/17-smart-ai-chat.md`를 갱신했다.

## 검증
- `npm run build:backend` 통과
