# 2026-04-09 ai provider connection A/B compare

## 변경 요약
- 실제 AI provider 하나를 backend 호출 경로에 연결하고, fallback과 timeout 정책을 고정했다.
- A/B 워킹트리 비교 후 A안을 선택했다.

## 배경
- `#72`는 AI provider 카탈로그와 adapter만 있던 상태에서, 실제 LLM 호출까지 이어지는 경로를 만드는 작업이다.
- 목표는 provider 1개를 먼저 붙이고, 실패 시 기존 shared fallback으로 돌아가게 만드는 것이다.

## 변경 내용
- `backend/src/lib/providers/ollama.ts`
  - Ollama chat 호출에 timeout abort를 추가했다.
- `backend/src/lib/ai-engine.ts`
  - intent와 answer를 Ollama structured output으로 먼저 시도하고, 실패 시 shared fallback으로 돌아가게 했다.
  - summary와 quiz에도 같은 timeout 정책을 적용했다.
- `backend/src/lib/ai-adapter.ts`
  - intent와 answer를 async provider 경로로 전환했다.
- `backend/src/routes/ai.ts`
  - 응답에 provider/model 메타데이터를 함께 돌려주도록 정리했다.
- `docs/project/20-status-and-next-steps.md`
  - AI provider 실제 연결 완료 상태를 반영했다.

## 연결 이슈
- Closes #72

## 검증
- `npm run build:backend`

## 코드리뷰
- A안은 provider client와 adapter를 분리해서 나중에 Gemini / Cloudflare 확장이 쉽다.
- B안은 라우트에 직접 묶는 방식이라 빠르지만, fallback과 timeout 정책이 퍼지기 쉬워서 제외했다.

## 체크 사항
- [x] A/B 워킹트리 비교 후 A안 선택
- [x] timeout 정책 적용
- [x] provider/model 메타데이터 응답 반영
- [x] backend 빌드 확인
- [x] 이슈 연결
