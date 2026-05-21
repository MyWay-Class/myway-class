# Gemini fallback 연동

## 왜 바꿨는가
- 이슈 #100은 AI provider 계층에 이미 정의된 Gemini를 실제 fallback 호출 경로로 연결하는 작업이다.
- 현재 summary와 quiz는 Ollama만 실제로 시도하고, 실패 시 바로 shared fallback으로 내려가 있어서 Gemini 계층이 비어 있었다.

## 무엇을 바꿨는가
- `backend/src/lib/providers/gemini.ts`를 추가해 Gemini `generateContent` JSON 호출 클라이언트를 만들었다.
- `summary`, `quiz` 엔진 실행에서 `Ollama -> Gemini -> shared fallback` 순으로 응답을 시도하게 바꿨다.
- Gemini 런타임 env와 wrangler 예시 값을 추가하고, provider 카탈로그에서 Ollama/Gemini 상태를 `available`로 맞췄다.
- AI 레이어 문서에 실제 fallback 순서를 반영했다.

## A/B 비교와 선택 이유
- A안: summary와 quiz 같은 JSON 결과형 기능부터 Gemini fallback을 연결하는 방식
- B안: intent, answer까지 한 번에 Gemini fallback을 넓히는 방식
- 이번에는 A안을 선택했다. 응답 shape가 더 안정적이고, 이슈의 Must인 fallback 호출과 Should인 우선순위 정책을 적은 변경으로 검증할 수 있었다.

## 어떻게 검증했는가
- `npm run build:backend`
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`
- 로컬 `wrangler dev`에서 `POST /api/v1/ai/summary`, `POST /api/v1/ai/quiz`를 호출해 Gemini/Ollama 미설정 환경에서도 `demo` fallback 응답과 provider/model 메타데이터가 유지되는지 확인했다.
