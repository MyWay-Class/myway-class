# 2026-04-10 AI 무료 티어 P0 보호 강화

## 변경 이유
- 공개 테스트에서 민감정보가 `wrangler.jsonc`에 남아 있던 부분을 제거해야 했음.
- `dev`/`staging`/`production`의 provider 정책을 실제 라우트에서 강제할 필요가 있었음.
- 무료 티어 공개 테스트에서 `AI/STT` 로그인, 일일 quota, 단기 rate limit, STT 길이 제한이 필요했음.

## 변경 내용
- `MYWAY_MEDIA_PROCESSOR_TOKEN`, `MYWAY_MEDIA_CALLBACK_SECRET`를 `wrangler.jsonc` vars에서 제거함.
- `MYWAY_AI_DAILY_LIMIT_TOTAL`을 추가하고, free_test 환경에 총량 quota를 넣음.
- `AI` 라우트와 `smart/chat`에 로그인 + rate limit + quota guard를 붙임.
- `dev`는 Ollama, `staging/production`은 Gemini 중심으로 강제되도록 provider 선택을 runtime 정책 기반으로 바꿈.
- `transcribe` 경로에 3분 하드 리밋을 추가함.
- D1 quota 테이블 마이그레이션 파일을 추가함.

## 검증
- `npm run verify` 통과
