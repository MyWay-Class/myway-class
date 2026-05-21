# Ollama smart chat integration

## 왜 바꿨는가
- 이슈 #98의 챗봇 경로는 아직 shared demo 흐름에 머물러 있어서, 실제 Ollama 기반 intent 분류와 요약/퀴즈/답변 경로가 필요했다.
- intent와 answer의 실행 메타데이터를 함께 돌려야 smart chat 응답의 provider/model도 표준화할 수 있었다.

## 무엇을 바꿨는가
- `backend/src/lib/ai-engine-runners.ts`에 intent/answer 실행 메타데이터를 담는 실행 래퍼를 추가했다.
- Ollama 응답이 길어질 때 demo fallback으로 빠지지 않도록 timeout 기준을 60초로 늘렸다.
- `backend/src/lib/smart-chat.ts`를 새로 만들어 smart chat을 Ollama 기반 intent 분류 후 summary, quiz, answer 엔진으로 라우팅하게 바꿨다.
- `backend/src/routes/smart.ts`는 새 smart chat 헬퍼를 호출하도록 단순화했다.
- `SmartChatResult`에 provider/model 메타데이터를 선택 필드로 추가하고, AI layer 문서를 갱신했다.
- 퀴즈 프롬프트는 응답 시간이 더 길어서 `OLLAMA_QUIZ_TIMEOUT_MS`를 별도로 두고 quiz route만 더 오래 기다리게 했다.

## 어떻게 검증했는가
- `npm run verify`
- 로컬 `runAIIntentWithExecution`에서 `provider=ollama`, `model=llama3.1:8b`가 내려오는 것을 확인했다.
- 로컬 `runAISummaryWithEngine`에서 `provider=ollama`, `model=llama3.1:8b`가 내려오는 것을 확인했다.
- 로컬 `runAIQuizWithEngine`에서 `provider=ollama`, `model=llama3.1:8b`가 내려오는 것을 확인했다.
- 로컬 `runSmartChat`에서 `route=summary`, `provider=ollama`, `model=llama3.1:8b`가 내려오는 것을 확인했다.
- 로컬 `runSmartChat` 퀴즈 요청에서도 `route=quiz`, `provider=ollama`, `model=llama3.1:8b`가 내려오는 것을 확인했다.
