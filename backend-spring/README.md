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
