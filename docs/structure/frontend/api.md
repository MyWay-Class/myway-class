# 프론트엔드 API 연동

## 목적
프론트에서 백엔드 API를 어떻게 호출하고 다루는지 정리한다.

## 규칙
- API 응답 타입은 `packages/shared`를 따른다.
- 네트워크 요청은 한 곳에서 모은다.
- 화면 컴포넌트는 직접 fetch를 남발하지 않는다.

## 권장 패턴
- `frontend/src/lib/api`
- `frontend/src/lib/query`
- `frontend/src/lib/mappers`

