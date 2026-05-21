# RAG, Intent, and Shared Module Restructure

## 배경
- 이슈 #43에서는 청킹, 인텐트, 엔티티, RAG를 하나의 흐름으로 묶되, 기존 AI/미디어 파이프라인과 충돌하지 않도록 정리할 필요가 있었다.
- `packages/shared/src`가 평평하게 나열된 상태였기 때문에, 도메인별 폴더 구조로 재편하는 것이 구조적 우선순위였다.

## 변경 내용
- `packages/shared/src`를 `ai/`, `lms/`, `data/`, `rag/`로 분리하고 각 폴더에 `index.ts`를 추가했다.
- `packages/shared/src/rag/{chunking,entities,pipeline}.ts`로 청킹, 엔티티 추출, 검색/답변 파이프라인을 분리했다.
- `backend/src/routes/ai-rag.ts`를 추가하고 `/api/v1/ai/rag`를 라우트 맵에 연결했다.
- `frontend/src/lib/ai-rag.ts`와 `frontend/src/features/lms/pages/AIChatPage.tsx`를 통해 RAG 파이프라인 결과를 화면에서 확인할 수 있게 했다.
- `docs/project/05-rag-structure.md`에 새 RAG 파이프라인 API를 반영했다.

## 검증 포인트
- `packages/shared/src`의 도메인 폴더 분리 후에도 frontend/backend 타입 체크가 통과했다.
- RAG 응답은 청킹, 인텐트, 엔티티, 검색 결과, 답변, provider 계획을 함께 담는다.
- 프론트 AI 채팅 화면에서 RAG 미리보기 영역이 표시된다.
