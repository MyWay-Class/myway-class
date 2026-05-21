# AI runtime policy and binding setup

## 왜 바꿨는가
- 무료 티어 공개 테스트를 위해 `dev`와 `staging`/`production`의 provider 정책을 분리할 공통 설정이 필요했다.
- quota와 공개 테스트 정책이 다음 단계에서 안정적으로 붙을 수 있도록 runtime bindings를 먼저 정리해야 했다.

## 무엇을 바꿨는가
- `backend/wrangler.jsonc`에서 D1 `DB`와 R2 `ASSETS` 바인딩을 추가하고, `MYWAY_GEMINI_API_KEY`를 vars에서 제거했다.
- `dev`는 Ollama 허용, `staging`/`production`은 free_test 정책 변수와 일일 한도 값을 가지도록 정리했다.
- `backend/src/lib/runtime-env.ts`에 `DB` 타입과 AI 공개 정책/일일 quota 설정 타입 및 헬퍼를 추가했다.

## 어떻게 검증했는가
- `git diff`로 wrangler 설정과 runtime bindings 변경 범위를 확인했다.
- 이후 quota/provider 작업이 바로 이어질 수 있도록 환경 변수 이름과 기본값을 정리했다.
