# 2026-05-24 auto metadata sync and e2e gate

## 요약
- STT 생성 시 강의 메타 동기화를 자동 실행하도록 연결했다.
- 데모 수강생 사용자 여정 E2E 게이트(Playwright)를 추가했다.

## 변경 내용
- `DemoLearningService`
  - `syncLectureMetadataForLectureFromTranscript(lectureId, overwriteExisting)` 추가.
  - 단일 강의 기준으로 transcript 기반 `learning_lecture_meta`를 업데이트.
- `MediaController`
  - `/api/v1/media/transcribe` 완료 응답에 `lecture_meta_sync`를 포함하도록 자동 동기화 연결.
  - `/api/v1/media/extract-audio/callback`에서 STT 자동 시작 후 동일하게 메타 동기화 연결.
- E2E 게이트
  - `@playwright/test` 추가.
  - `playwright.config.ts` 추가.
  - `e2e/demo-student-journey.spec.ts` 추가:
    - 로그인 → 내 강의 → 차시 시청 화면 도달 검증.
  - `.github/workflows/e2e-demo-student.yml` 추가:
    - PR(dev)에서 backend/frontend 기동 후 Playwright E2E 실행.

## 검증
- `backend-spring: .\mvnw.cmd "-Dtest=MediaContractTest,StudentLearningFlowContractTest" test` 통과
- `npm run smoke:media-ai-shortform` 통과
- `npm run test:e2e:demo-student` 통과
