# 2026-04-09 프론트 dev 런타임 및 파비콘 정리

## 변경 이유
- 로컬에서 `npm run dev:frontend` 실행 후 `500 Internal Server Error`, `_jsxDEV is not a function`, `favicon` 응답 오류가 함께 발생했다.
- 프론트 UX 작업을 이어가기 전에 개발 서버를 안정적으로 띄울 수 있는 상태로 먼저 복구할 필요가 있었다.

## 변경 내용
- `shims/react-cjs-loader.mjs`가 개발 서버에서도 React dev runtime을 직접 읽도록 조정했다.
- `frontend/index.html`의 파비콘 참조를 정리하고, `frontend/public/` 아래에 `favicon.svg`, `favicon.ico`를 추가했다.
- 의존성 실행 파일이 누락된 상태를 해소하기 위해 루트에서 `npm install`을 다시 수행했고, 그 결과 `package-lock.json`을 갱신했다.

## 영향 범위
- 프론트 개발 서버 실행 경로
- 프론트 정적 자산 로딩 경로
- 루트 의존성 잠금 파일

## 검증
- `npm run build:frontend` 통과
- `http://127.0.0.1:5173/` 응답 `200` 확인
- `http://127.0.0.1:5173/favicon.svg` 응답 `200` 확인
- `http://127.0.0.1:5173/favicon.ico` 응답 `200` 확인
