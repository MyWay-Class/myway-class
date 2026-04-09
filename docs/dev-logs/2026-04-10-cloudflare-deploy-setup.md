# 2026-04-10 Cloudflare 배포 설정 정리

## 변경 요약
- 프론트의 API 주소를 `VITE_API_BASE_URL` 환경변수 기반으로 전환했다.
- Cloudflare Pages와 Workers를 분리 배포할 때 필요한 설정을 문서에 반영했다.
- 로컬 전용 주소를 프로덕션에서 그대로 쓰지 않도록 정리했다.

## 적용 위치
- `frontend/src/lib/api-core.ts`
- `frontend/src/lib/ai-rag.ts`
- `docs/project/19-deployment.md`

## 배포 기준
- Pages는 `frontend/dist`
- Workers는 `backend/src/index.ts`
- Pages 환경변수로 `VITE_API_BASE_URL`을 넣어 Workers API를 바라보게 한다.

## 확인
- 프론트 타입체크로 env 접근이 문제 없는지 확인한다.
