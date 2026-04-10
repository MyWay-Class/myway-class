# 2026-04-11 D1 media binding

- Cloudflare D1 `myway-class-data`를 생성했다.
- `backend/wrangler.jsonc`에 `MEDIA_DB` 바인딩을 추가했다.
- `backend/src/lib/runtime-env.ts`에 `MEDIA_DB` 타입을 추가했다.
- 아직 실제 transcript/note/extraction 저장소 레이어는 연결 전이다.

## 검증
- `wrangler d1 list`에서 `myway-class-data` 확인
