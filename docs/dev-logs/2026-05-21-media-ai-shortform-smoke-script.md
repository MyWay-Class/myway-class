# 2026-05-21 Media/AI/Shortform Smoke Script

## 배경
- 로컬/배포에서 데모 영상 실행 경로(강의 질의 + 숏폼 export 완료)를 빠르게 재확인할 공통 스모크 명령이 필요했다.

## 변경
- `scripts/smoke-media-ai-shortform.ts` 추가
  - `/api/v1/health`
  - `/api/v1/auth/login` (학생/관리자)
  - `/api/v1/ai/rag` (청킹 결과 확인)
  - `/api/v1/shortform/compose` -> `/api/v1/shortform/export/callback` -> `/api/v1/shortform/video/:id`
  - `/api/v1/admin/media/batch/status`
- 루트 `package.json`에 `smoke:media-ai-shortform` 스크립트 추가
- `docs/project/11-testing-and-verification.md` 실행 명령 목록 갱신

## 검증
- `npm run smoke:media-ai-shortform` 통과
