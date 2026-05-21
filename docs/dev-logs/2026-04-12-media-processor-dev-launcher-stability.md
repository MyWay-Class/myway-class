# 2026-04-12 media processor dev launcher stability

## 왜 바꿨는지
- `tsx`로 `scripts/media-processor/server.ts` 를 직접 실행할 때 Windows 백그라운드 실행 경로에서 `spawn EPERM` 이 발생했다.
- TS/TSX 소스는 그대로 두되, 실행 진입점만 안정적으로 고정해야 로컬 dev에서 media processor를 계속 살릴 수 있었다.

## 무엇을 바꿨는지
- 루트 `package.json` 의 `dev:media-processor` 를 `esbuild` 번들 후 `node` 실행 방식으로 바꿨다.
- `tsx` 의존성을 루트에서 제거했다.
- `npm install` 로 lockfile을 현재 설치 상태에 맞췄다.

## 어떻게 검증했는지
- `npm run verify` 를 다시 돌려서 backend, frontend, media processor 타입 검사를 통과시켰다.
- `scripts/media-processor/server.ts` 는 그대로 TS 소스로 유지된다.

## 참고
- 이 변경은 소스 언어를 바꾸는 작업이 아니라, Windows dev 환경에서 프로세스를 안정적으로 띄우기 위한 런처 정리다.
