# 2026-04-08 Shortform Community

## 변경 이유
- 숏폼 생성과 커뮤니티 기능을 `shortform` 도메인으로 분리해 책임 경계를 선명하게 만들었다.
- 워킹트리 비교에서 route 분리안과 course 통합안 중 route 분리안이 파일 크기와 재사용성 면에서 더 낫다고 판단했다.

## 변경 내용
- `backend/src/routes/shortform.ts`를 추가하고 숏폼 생성, 조립, 공유, 담아가기, 좋아요, 커뮤니티 조회를 분리했다.
- `packages/shared/src/shortform.ts`에 demo 상태와 helper를 모아 공통 로직을 재사용했다.
- `docs/project/04-api-contract.md`, `docs/project/15-api-map.md`에 실제 숏폼 API 경로를 반영했다.

## 검증
- `npm run build:backend` 통과
- 워킹트리 비교 결과 A안 채택
