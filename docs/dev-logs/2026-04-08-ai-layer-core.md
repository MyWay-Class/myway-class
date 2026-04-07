# AI 레이어 코어

## 문서 유형
기록 허브입니다. AI 레이어의 원본 계약을 문서와 코드에 맞춰 추가한 변경 기록입니다.

---

## 변경 요약
- `packages/shared/src/ai.ts`를 추가해 인텐트, 검색, 질문응답, 요약, 퀴즈 공통 로직을 모았다.
- `backend/src/routes/ai.ts`를 추가해 `/api/v1/ai/*` 엔드포인트를 노출했다.
- `docs/project/05-rag-structure.md`, `docs/project/06-intent-nlu-structure.md`, `docs/project/14-ai-layer.md`, `docs/project/15-api-map.md`를 실제 구현에 맞췄다.
- 구현은 `단일 AI 파일`과 `intent/search/answer` + `summary/quiz` 분리안을 비교한 뒤, 파일 길이와 책임 분리를 위해 분리안을 채택했다.

## 검증
- `npm run build`
