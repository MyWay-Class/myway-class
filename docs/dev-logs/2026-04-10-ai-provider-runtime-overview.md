# 2026-04-10 AI provider runtime overview

## 변경 이유
- `GET /api/v1/ai/providers`가 정적 catalog만 보여주면 실제 배포 환경의 provider 경로를 확인하기 어려웠음.
- `dev`와 `staging/production`의 실행 provider를 분리하는 정책을 진단 API에 반영할 필요가 있었음.

## 변경 내용
- backend provider helper에 runtime-aware overview를 추가했다.
- `/api/v1/ai/providers`가 현재 환경의 runtime policy와 실제 fallback chain을 내려주도록 바꿨다.
- 배포 문서에 `dev=Ollama`, `staging/production=Gemini + Cloudflare AI` 기준을 반영했다.

## 검증
- provider overview가 runtime policy 기준으로 구성되도록 코드 경로를 정리했다.
