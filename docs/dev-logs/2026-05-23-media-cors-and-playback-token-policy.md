# 2026-05-23 Media CORS and Playback Token Policy

## 배경
- 로컬/배포 환경에서 영상 재생 요청 시 `CORS`와 토큰 처리 경로가 섞여 400/401/403 해석이 어려웠다.
- `Accept: video/*` 재생 요청에서 JSON 에러 응답이 content negotiation에 걸려 406/500으로 보이는 문제가 있었다.

## 변경 내용
- `CorsConfig`
  - `myway.cors.allowed-origins` 프로퍼티 기반으로 허용 도메인 관리
  - 기본값: `http://127.0.0.1:5173,http://localhost:5173`
  - 미디어 재생에 필요한 응답 헤더 노출(`Content-Range`, `Accept-Ranges`, `Content-Disposition` 등)
- `MediaController /api/v1/media/assets/**`
  - JWT query token(`?token=`)과 Authorization 검증 경로 통합
  - playback 요청 인증 실패 시 `401 + X-Error-Code=MEDIA_PLAYBACK_TOKEN_INVALID`
  - 원본 서버 연결 실패 시 `502 + X-Error-Code=MEDIA_ASSET_PROXY_UNAVAILABLE`
  - `Accept: video/*` 상황에서도 에러 응답이 안정적으로 내려가도록 playback 에러를 헤더 기반으로 통일
- 설정값 추가
  - `myway.auth.jwt.secret`, `myway.auth.jwt.ttl-hours`, `myway.cors.allowed-origins`

## 검증
- `backend-spring`: `./mvnw -q -DskipTests compile` 통과
- 계약 테스트:
  - `./mvnw -q "-Dtest=MediaContractTest,StudentLearningFlowContractTest" test` 통과
  - `MediaContractTest`에 playback token 정책 케이스 추가

## 리스크/롤백
- 리스크: 원본 자산 서버 장애 시 재생이 `502`로 명확히 노출(기존 silent fallback과 동작 차이).
- 롤백: 해당 커밋 revert 시 기존 에러 응답 정책으로 복귀.
