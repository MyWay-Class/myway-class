# 2026-04-07 인증과 권한 관리 작업 로그

## 변경 이유
- 기본 LMS에 로그인, 세션, 역할 기반 접근 제어를 얹어야 강의 관리와 학습 화면의 책임이 분리된다.
- 강사와 운영자, 수강생의 동작을 같은 화면에서 구분할 수 있어야 이후 관리자 기능과 권한 보호를 붙이기 쉽다.

## 변경 내용
- `packages/shared/src/index.ts`에 인증 사용자, 세션, 로그인 응답, 역할 권한 헬퍼를 추가했다.
- `backend/src/routes/auth.ts`와 `backend/src/lib/auth.ts`를 추가해 로그인, 내 정보, 로그아웃, 세션 저장을 구현했다.
- `backend/src/routes/dashboard.ts`, `backend/src/routes/enrollments.ts`, `backend/src/routes/courses.ts`에 인증 기반 접근 제어를 연결했다.
- `frontend/src/App.tsx`와 `frontend/src/lib/api.ts`에 데모 계정 로그인, 세션 유지, 로그아웃, 권한별 수강 제한을 추가했다.
- `docs/project/04-api-contract.md`, `docs/project/13-domain-entities.md`, `docs/project/15-api-map.md`, `docs/project/12-lms-core.md`를 갱신했다.

## 검증 상태
- 인증이 필요한 라우트와 화면 흐름은 코드상 연결했다.
- `npm run build`로 프론트와 백엔드 타입/번들 검증을 통과했다.
- 실제 브라우저에서의 상세 동작은 서버와 화면을 같이 띄워 확인해야 한다.
