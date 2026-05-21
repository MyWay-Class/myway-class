# AI Engine Provider Split

## 배경
- AI provider 카탈로그와 fallback 계획은 있었지만, 실제 엔진 호출 코드는 아직 없었다.
- summary와 quiz는 JSON 형태로 안정적으로 검증할 수 있어서 첫 실제 엔진 적용 대상으로 잡았다.

## 변경 내용
- `backend/src/lib/providers/ollama.ts`와 `backend/src/lib/providers/index.ts`를 추가해 Ollama HTTP 호출을 backend 내부 provider 클라이언트로 분리했다.
- `backend/src/lib/ai-engine.ts`를 추가해 summary와 quiz에 대해 Ollama 응답을 먼저 시도하고, 실패 시 기존 shared fallback으로 되돌아가게 했다.
- `backend/src/lib/ai-adapter.ts`와 `backend/src/routes/ai.ts`를 비동기 처리로 바꿔 실제 엔진 호출을 route 경로에 연결했다.

## 검증 포인트
- Ollama 응답이 JSON이 아니거나 연결되지 않으면 기존 요약/퀴즈 생성 로직으로 안전하게 fallback한다.
- summary가 `timeline` 스타일일 때는 아직 기존 shared 로직을 유지한다.
- provider 분리는 유지하면서도 기존 API 응답 형태는 바꾸지 않는다.
