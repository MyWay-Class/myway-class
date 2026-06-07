# 2026-04-13 Smart Chat Dev Speed Fix

- `backend/src/lib/smart-chat.ts`에서 `public_mode === 'dev'`일 때 스마트 채팅이 원격 모델 경로를 타지 않고 로컬 `buildSmartChatOverview()` 결과를 바로 반환하도록 바꿨다.
- `backend/src/lib/smart-chat.ts`에 단계별 타이밍 로그를 추가해서 `base_fallback`, `intent`, `summary`, `quiz`, `answer`, `complete` 구간의 지연을 구분할 수 있게 했다.
- `packages/shared/src/ai/intent/pipeline.ts`와 `packages/shared/src/ai/intent/helpers.ts`에서 근거가 약한 답변은 억지로 생성하지 않고, `교수/강사 이름` 같은 메타 질문은 강의 메타데이터를 직접 반환하도록 했다.
- 효과:
  - `smart/chat` 응답 지연을 크게 줄인다.
  - dev 환경에서 Ollama/Gemini 타임아웃 때문에 생기던 체감 지연을 피한다.
  - 답변은 강의 근거 기반의 로컬 fallback을 우선 사용하므로 덜 흔들린다.
  - 강의 본문과 무관한 질문에 대해 엉뚱한 인용문을 내보내는 문제를 줄인다.
