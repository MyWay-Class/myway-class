# 2026-04-09 프론트 표준 React import 복귀

## 변경 이유
- 내부 CJS shim을 통해 React runtime을 우회하던 방식에서 `Do not use internal APIs of your dependencies` 경고가 발생했다.
- 프론트 진입점은 정식 import만 사용하도록 단순화하는 편이 유지보수와 호환성에 더 안전했다.

## 변경 내용
- `frontend/src/main.tsx`는 `import React from 'react'`와 `import ReactDOM from 'react-dom/client'`를 유지했다.
- `vite.config.mjs`는 JSX를 classic runtime으로 변환하고, 필요한 경우 React 기본 import만 자동 주입하도록 정리했다.
- `react/jsx-dev-runtime`와 `react/jsx-runtime`을 직접 쓰던 경로는 제거했다.
- `shims/` 아래의 React 로더는 공개 엔트리만 읽고, 앱 코드에서는 내부 `react/cjs/*`를 직접 참조하지 않도록 유지했다.
- `vite.config.mjs`에 Tailwind `content` 경로를 명시해 스타일 경고를 제거했다.

## 영향 범위
- 프론트 개발 서버 런타임
- React 진입점 import 방식
- Vite 설정과 의존성 우회 경로

## 검증
- `npm run build:frontend` 통과
- 로컬 `5173` dev 서버 기준으로 `react/jsx-dev-runtime` 직접 import 없이 렌더링이 가능하도록 정리 완료
- `tailwind content` 경고 없이 빌드가 정상 종료됨
