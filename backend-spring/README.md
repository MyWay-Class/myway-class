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
- Store: H2 file DB (`jdbc:h2:file:./data/myway-feature-store`)
- Adapter: `FeatureJdbcStore`
- Scope-based 저장 구조:
  - KV: `scope + item_id` 기반 단건 상태 저장
  - Event: `scope + owner_id + event_id` 기반 이력 저장
- 주요 스코프:
  - AI: `ai_settings`, `ai_usage_daily`, `ai_log`
  - Media: `media_transcript`, `media_extraction`, `media_pipeline`, `media_note`, `media_asset`
  - Shortform: `shortform_extraction`, `shortform_video`, `shortform_save`, `shortform_share`, `shortform_like`
  - Custom: `custom_course`

## Shortform Retry / Callback Policy
- 재시도 상한: `myway.shortform.retry.max-attempts` (기본값 3, 최소 1)
- 재시도 흐름:
  1. 실패 상태에서 `/api/v1/shortform/retry` 호출 시 `retry_count` 증가
  2. 상한 미만이면 `PROCESSING`으로 재진입
  3. 상한 도달 시 `FAILED_PERMANENT`로 고정
- Callback 멱등/순서 보장:
  - `event_version`이 현재 `last_event_version`보다 작거나 같으면 무시
  - 최신 버전 이벤트만 상태를 갱신

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
