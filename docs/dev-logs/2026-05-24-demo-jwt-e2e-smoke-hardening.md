# 2026-05-24 demo JWT E2E smoke hardening

## 요약
- `scripts/smoke-media-ai-shortform.ts`를 확장해 데모 JWT 기반 학습 플로우를 종단 검증하도록 강화했다.

## 추가 검증 항목
- `/api/v1/auth/me`로 로그인 사용자 일치 검증 (`usr_std_001`).
- `/api/v1/enrollments`에 스모크 코스(`crs_java_01`) 수강 상태 포함 여부 검증.
- `/api/v1/courses/{courseId}`에서 강의 목록 존재 및 대상 강의(`lec_java_01`) 포함 여부 검증.
- `/api/v1/lectures/{lectureId}`에서 강의-코스 매핑 무결성 검증.
- `/api/v1/media/lecture-video/{lectureId}`에서 영상 에셋 매핑(`asset_key`) 존재 검증.
- `/api/v1/media/transcript/{lectureId}`에서 강의 트랜스크립트 존재 검증.

## 기존 검증 유지
- RAG 검색 타임스탬프/lecture mapping 검증.
- AI search source 타임스탬프 범위 검증.
- shortform compose/callback/video 조회 및 multi-lecture compose payload 무결성 검증.
- 관리자 배치 상태 API 검증.

## 로컬 검증
- `npm run smoke:media-ai-shortform` 통과.
