# 프론트엔드 설정

## 목적
프론트엔드가 어떤 기준으로 시작되고 유지되는지 정리한다.

## 기본 스택
- React
- TypeScript
- Vite
- Cloudflare Pages 배포

## 규칙
- 컴포넌트는 함수형으로 작성한다.
- 상태는 꼭 필요한 만큼만 둔다.
- 서버 상태와 UI 상태를 구분한다.
- API 계약은 `packages/shared`의 타입을 따른다.

