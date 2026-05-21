# 2026-04-08 refactor course flow structure

## 문서 유형
기록 문서입니다. 강의/수강/진도 흐름을 실무 기준으로 다시 쪼갠 이유를 남깁니다.

## 변경 내용
- `packages/shared`를 `types`, `demo-data`, `auth`, `learning`으로 분리했다.
- 프론트 대시보드를 `Identity`, `Catalog`, `Lecture` 섹션으로 나눴다.
- `App.tsx`는 상태와 이벤트만 남기고 화면 렌더링을 위임했다.

## 검증
- `npm run build` 통과
- 주요 파일들이 300라인 기준 안으로 들어왔다
