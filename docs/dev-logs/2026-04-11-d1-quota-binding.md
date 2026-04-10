# 2026-04-11 D1 quota binding

- Cloudflare D1 `myway-class-quota`를 생성했다.
- `backend/wrangler.jsonc`의 `DB` 바인딩에 실제 `database_id`를 연결했다.
- 다음 단계로 migration을 적용해 quota 테이블을 생성한다.

## 검증
- D1 목록에서 `myway-class-quota` 확인
