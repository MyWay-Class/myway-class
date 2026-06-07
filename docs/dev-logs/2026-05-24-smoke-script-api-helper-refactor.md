# 2026-05-24 smoke script API helper refactor

## 요약
- `scripts/smoke-media-ai-shortform.ts`의 인증 API 호출 중복을 제거하기 위해 `authedApi` 헬퍼를 추가했다.

## 변경 내용
- `authedApi(token, path, options)` 추가:
  - Authorization 헤더 병합을 공통 처리.
- `auth/me`, `enrollments`, `courses/{id}`, `lectures/{id}`, `media/lecture-video/{id}`, `media/transcript/{id}`, `shortform/video/{id}`, `admin/media/batch/status` 호출을 헬퍼로 대체.

## 효과
- 중복 코드 감소.
- 향후 인증 헤더 정책 변경 시 수정 지점 단일화.

## 로컬 검증
- `npm run smoke:media-ai-shortform` 통과.
