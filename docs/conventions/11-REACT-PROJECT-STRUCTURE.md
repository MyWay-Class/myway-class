# React 프로젝트 구조

## 목적
프론트 파일 배치를 일정하게 유지한다.

## 권장 구조
- `frontend/src/components`
- `frontend/src/pages`
- `frontend/src/lib`
- `frontend/src/hooks`

## 규칙
- 페이지와 컴포넌트를 섞지 않는다.
- API 로직은 `lib`로 모은다.
- 페이지나 큰 화면은 상태만 가지고, 실제 렌더링은 섹션 컴포넌트로 나눈다.
- 화면 파일이 200줄을 넘기기 시작하면 `components/` 아래에 섹션 단위로 분리한다.
