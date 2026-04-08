# 2026-04-09 프론트 표준 React import 복귀

## 변경 이유
- 내부 CJS shim을 통해 React runtime을 우회하던 방식에서 `Do not use internal APIs of your dependencies` 경고가 발생했다.
- 프론트 진입점은 정식 import만 사용하도록 단순화하는 편이 유지보수와 호환성에 더 안전했다.

## 변경 내용
- `frontend/src/main.tsx`는 `react`와 `react-dom/client`의 정식 import 형태로 유지했다.
- `vite.config.mjs`에서 Sucrase 변환 결과가 `react/jsx-runtime`와 `react/jsx-dev-runtime`의 실제 패키지 엔트리로 새지 않도록, 내부 변환된 import만 로컬 shim으로 다시 매핑했다.
- `vite.config.mjs`에 Tailwind `content` 경로를 명시해 스타일 경고를 제거했다.
- `shims/` 아래의 React 런타임 파일은 공개 엔트리와 개발용 CJS 소스를 기준으로 동작하도록 유지했다.

## 영향 범위
- 프론트 개발 서버 런타임
- React 진입점 import 방식
- Vite 설정과 의존성 우회 경로

## 검증
- `npm run build:frontend` 통과
- 로컬 `5173` dev 서버 기준으로 `react` shim 경로에서 내부 CJS 직접 참조 없이 렌더링이 가능하도록 정리 완료
- `tailwind content` 경고 없이 빌드가 정상 종료됨
