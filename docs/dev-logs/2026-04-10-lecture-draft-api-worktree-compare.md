# 2026-04-10 강의 초안 API 워킹트리 비교

- issue #133는 강의 제작 초안 저장/발행 API를 추가하는 작업이다.
- 실제 워킹트리 A/B를 분리해 비교했다.
- A안은 `backend/src/routes/courses.ts`에 강의 초안 API를 붙이는 방식이었다.
- B안은 `backend/src/routes/lecture-drafts.ts`를 별도 라우트로 두는 방식이었다.
- 둘 다 먼저 타입 충돌이 있었지만, 공통 헬퍼를 `Lecture` 기반으로 넓혀서 해결했다.
- 검증 결과는 두 안 모두 통과했지만, B안이 라우트 경계를 분리해서 더 유지보수가 쉬웠다.
- 그래서 B안을 선택해 다음 정리 작업을 이어간다.

## 검증
- `npm run verify` 통과
