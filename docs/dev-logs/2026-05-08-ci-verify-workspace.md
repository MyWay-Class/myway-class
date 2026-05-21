# 2026-05-08 CI verify-workspace 워크플로 추가

## 요약
- `npm run verify`(frontend build + backend spring test)를 GitHub Actions에서 자동 실행하도록 워크플로를 추가했다.
- PR/Push(`dev`)에서 통합 검증이 동일하게 수행되도록 맞췄다.

## 변경 파일
- `.github/workflows/verify-workspace.yml`

## 기대 효과
- 프론트 빌드와 백엔드 테스트를 분리 실행하던 누락 리스크를 줄인다.
- 로컬/CI 검증 명령을 `npm run verify`로 단일화해 운영 안정성을 높인다.
