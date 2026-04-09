# 2026-04-09 빌드와 의존성 점검 자동화

## 한줄 요약
루트 스크립트에 dependency check와 검증 명령을 추가해서 backend 의존성 누락과 빌드 검증을 한 번에 확인할 수 있게 했다.

## 구현 내용
- `package.json`에 `check:frontend-deps`, `check:backend-deps`, `check:deps`, `verify`를 추가했다.
- `verify`는 dependency check, backend build, frontend typecheck를 한 번에 실행한다.
- `docs/project/11-testing-and-verification.md`에 새 검증 명령을 정리했다.
- `docs/project/20-status-and-next-steps.md`와 `docs/project/00-index.md`를 함께 갱신해 후속 작업 맥락을 연결했다.
- frontend 스크립트는 워크스페이스 밖의 루트 Vite config를 사용하도록 맞춰 `frontend/` 내부에 JS 앱 파일이 남지 않게 했다.

## 검증
- `npm run check:deps` 통과
- `npm run verify` 통과
- `npm run build:backend` 통과
- `npm run build:frontend`는 현재 Windows 환경의 Vite `spawn EPERM` 이슈로 추가 확인이 필요하다
