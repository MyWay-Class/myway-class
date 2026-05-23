# 2026-05-23 JWT/DB Auth + Student Learning Flow Contract

## 배경
- 데모 계정/세션이 메모리 기반이라 서버 재기동 시 인증 상태가 사라지고, 토큰이 비표준 형식(`sess_*`)이었다.
- 학생 권한 기준의 핵심 학습 흐름(강의목록/강의상세/전사/RAG) 회귀를 CI에서 고정할 필요가 있었다.

## 변경 내용
- 인증 저장소 DB 전환
  - `auth_users`, `auth_sessions` 테이블을 `schema.sql`에 추가.
  - `AuthJdbcStore` 추가:
    - 사용자 조회/목록/업서트
    - 세션 생성/조회/폐기
- JWT 세션 도입
  - `SessionService`를 JWT 발급/검증 기반으로 교체.
  - 로그인 시 `jti(token_id)`를 `auth_sessions`에 저장하고, `me` 호출 시 서명+만료+DB 세션 상태를 함께 검증.
  - logout 시 세션 revoke 처리.
  - 서버 시작 시 `DemoUsers`를 DB로 시드.
- Auth API 조정
  - `/api/v1/auth/users`가 상수 목록이 아니라 DB 사용자 목록을 반환하도록 변경.
- 학생 학습 플로우 계약 테스트 추가
  - `StudentLearningFlowContractTest`
  - 시나리오:
    1) 학생 로그인
    2) 수강 코스/강의 조회
    3) 강사 선행 전사 생성
    4) 학생 전사 조회
    5) 학생 RAG 질의 성공 확인

## 검증
- `backend-spring`: `./mvnw -q -DskipTests compile` 통과
- 계약 테스트: `./mvnw -q "-Dtest=StudentLearningFlowContractTest,MediaContractTest,AiContractTest" test` 통과

## 리스크/롤백
- 리스크: JWT secret 설정이 너무 짧으면 키 생성 이슈 가능(코드에서 최소 길이 패딩 처리).
- 롤백: 해당 커밋 revert 시 기존 메모리 세션 모델로 복귀.
