# myway-class Spring Migration (Java 21)

## Runtime
- Java: 21
- Build: Maven Wrapper (`backend-spring/mvnw.cmd`, `backend-spring/pom.xml`)
- API Port: 8787

## Local Commands
- Run: `mvnw.cmd spring-boot:run`
- Test: `mvnw.cmd test`
- Package: `mvnw.cmd -DskipTests package`

## JAVA_HOME Setup (Windows)
- one-time setup script:
  - `powershell -ExecutionPolicy Bypass -File ..\\scripts\\setup\\set-java-home.ps1 -JavaHome "C:\\Program Files\\Java\\jdk-21"`
- then reopen terminal and validate:
  - `mvnw.cmd -v`

## CI
- GitHub Actions workflow: `.github/workflows/backend-spring-tests.yml`
- trigger: push/pull_request to `dev`, `workflow_dispatch`(수동 실행)
- concurrency: 동일 브랜치에서 새 실행 시작 시 이전 실행 자동 취소(`cancel-in-progress: true`)
- timeout: job 기준 15분(`timeout-minutes: 15`)

## Persistence Architecture
- Local store: H2 file DB (`jdbc:h2:file:./data/myway-feature-store`)
- Production store: PostgreSQL/Supabase (`MYWAY_DB_URL`, `MYWAY_DB_USERNAME`, `MYWAY_DB_PASSWORD`)
- Adapter: `FeatureJdbcStore`
- Auth store: `auth_users` and `auth_sessions` are persisted through `AuthJdbcStore` and validated on the backend before any protected route succeeds.
- Scope-based 저장 구조:
  - KV: `scope + item_id` 기반 단건 상태 저장
  - Event: `scope + owner_id + event_id` 기반 이력 저장
- 주요 스코프:
  - AI: `ai_settings`, `ai_usage_daily`, `ai_log`
  - Media: `media_transcript`, `media_extraction`, `media_pipeline`, `media_note`, `media_asset`
  - Shortform: `shortform_extraction`, `shortform_video`, `shortform_save`, `shortform_share`, `shortform_like`
  - Custom: `custom_course`
- 운영 참고:
  - `FeatureJdbcStore`는 H2와 PostgreSQL을 모두 지원한다.
  - callback/version 충돌은 `last_event_version` 기준으로 차단한다.
  - signed callback은 `nonce + ttl + secret` 검증을 통과해야 한다.

## Shortform Retry / Callback Policy
- 재시도 상한: `myway.shortform.retry.max-attempts` (기본값 3, 최소 1)
- 재시도 흐름:
  1. 실패 상태에서 `/api/v1/shortform/retry` 호출 시 `retry_count` 증가
  2. 상한 미만이면 `PROCESSING`으로 재진입
  3. 상한 도달 시 `FAILED_PERMANENT`로 고정
- Callback 멱등/순서 보장:
  - `event_version`이 현재 `last_event_version`보다 작거나 같으면 무시
  - 최신 버전 이벤트만 상태를 갱신

## Security Notes
- Authenticated API는 JWT 세션을 사용한다.
- JWT는 서명 검증만으로 끝나지 않고, `auth_sessions`의 active row와 `expires_at`까지 확인해야 유효하다.
- 만료된 세션은 `/api/v1/auth/me`와 모든 보호 API에서 401로 처리한다.
- 외부 processor callback은 `MYWAY_MEDIA_CALLBACK_SECRET`과 `MYWAY_MEDIA_PROCESSOR_TOKEN`으로 보호한다.
- callback replay는 nonce guard로, stale version은 `last_event_version` guard로 방어한다.
- 운영 로그에는 raw secret을 남기지 않는다.

## Railway Deployment Checklist
- Java 21 런타임을 사용한다.
- Build command: `./mvnw -DskipTests package`
- Start command: `java -jar target/backend-spring-0.1.0.jar`
- Required env vars:
  - `MYWAY_DB_URL`
  - `MYWAY_DB_USERNAME`
  - `MYWAY_DB_PASSWORD`
  - `MYWAY_MEDIA_PROCESSOR_URL`
  - `MYWAY_MEDIA_PROCESSOR_TOKEN`
  - `MYWAY_MEDIA_CALLBACK_SECRET`
- Optional env vars:
  - `MYWAY_AI_PUBLIC_MODE`
  - `MYWAY_AI_REQUIRE_AUTH`
  - `MYWAY_AI_ENABLE_STT`
  - `MYWAY_AI_ENABLE_MEDIA_UPLOAD`
- If using Supabase pooler, keep `sslmode=require` in the JDBC URL.
- If using a managed Postgres pooler, prefer a single JDBC URL source of truth and keep the same URL in local smoke tests to avoid auth/session drift.
- Validate with `mvnw.cmd test` before deploying the release tag.

## Implemented Endpoints
- GET `/`
- GET `/api/v1/health`
- `/api/v1/auth/*`
- GET `/api/v1/dashboard`
- `/api/v1/courses/*`
- `/api/v1/lectures/*`
- `/api/v1/enrollments/*`
- POST `/api/v1/smart/chat`
- `/api/v1/media/*`
- `/api/v1/shortform/*`
- `/api/v1/ai/*`
- `/api/v1/custom-courses/*`

## Not Yet Migrated (501)
- `/api/v1/legacy/*`
