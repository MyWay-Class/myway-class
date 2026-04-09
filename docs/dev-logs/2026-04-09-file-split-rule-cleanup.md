# 2026-04-09 파일/폴더 분리 규칙 정리

## 변경 요약
- 대용량 공용 모듈을 도메인별 하위 파일로 분리했다.
- 300줄 초과 파일은 모두 해소했다.
- 프론트/백엔드/shared의 기능 책임을 더 작은 단위로 나눴다.

## 주요 분리
- `frontend/src/lib/api.ts`
- `backend/src/lib/ai-engine.ts`
- `packages/shared/src/lms/learning/dashboard.ts`
- `packages/shared/src/ai/ai-recommendations.ts`
- `frontend/src/features/lms/pages/AdminStatsPage.tsx`

## 확인
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit` 통과
- 파일 길이 규칙 위반이 큰 범위에서 해소됐다.
