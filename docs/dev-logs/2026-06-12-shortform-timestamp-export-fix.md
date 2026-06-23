# 2026-06-12 Shortform export fallback and timestamp seek fix

## 변경 요약
- lecture watch timestamp seek를 `fastSeek -> currentTime -> play` 순으로 분리해 더 안정적으로 이동하게 만들었다.
- 배포 환경에서 media processor가 없을 때 shortform export를 데모 MP4로 완료 처리하도록 fallback을 추가했다.
- Pages 정적 자산으로 데모 export 비디오를 추가했다.

## 검증
- `npm --workspace @myway/frontend run test -- src/features/lms/pages/lectureSeek.test.ts`
- `npx tsx backend/src/routes/shortform-route-helpers.test.ts`
- `npm run build:frontend`
- `npm run build:backend`
- `wrangler deploy --env production`
- `wrangler pages deploy frontend/dist --project-name mywayclass --branch main`

## 배포
- Backend: `https://myway-class-api-production.ggg9905.workers.dev`
- Frontend: `https://main.mywayclass.pages.dev`

## 확인된 동작
- lecture watch script panel에서 transcript chunk가 렌더된다.
- 타임스탬프 클릭 시 video `currentTime`이 실제로 이동한다.
- shortform compose API가 `COMPLETED` 상태와 데모 export URL을 반환한다.
