# 2026-04-10 Cloudflare Pages 배포

## 변경 요약
- 프론트 API 주소를 `VITE_API_BASE_URL` 기반으로 빌드했다.
- Cloudflare Pages 프로젝트 `mywayclass`를 생성하고 프론트 산출물을 업로드했다.
- 백엔드 `wrangler.jsonc`의 dev/prod 기준을 배포용으로 정리했다.

## 배포 결과
- Pages deployment URL: `https://c99414b0.mywayclass.pages.dev`
- Pages project: `mywayclass`
- Backend Worker URL: `https://myway-class-api.ggg9905.workers.dev`

## 확인
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit` 통과
- `npm run build:backend` 통과
- `frontend` build는 `VITE_API_BASE_URL` 주입 후 정상 완료
