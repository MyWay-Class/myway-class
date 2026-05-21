# 2026-04-13 Learning Store DB Persistence

## 변경 요약
- 강의 생성/자료/공지/수강신청/진도 저장을 `MEDIA_DB` 기반 D1 테이블에 write-through로 연결했다.
- 서버 시작 시 D1 내용을 기존 demo 배열로 다시 hydrate해서, `listCourseCards()`와 `getCourseDetail()` 같은 기존 공유 흐름을 유지했다.
- 신규 D1 스키마를 `backend/migrations/0003_learning_store.sql`에 추가했다.

## 이유
- 기존 course/lecture/enrollment 데이터가 메모리 전용이라 재시작 후 사라졌다.
- 공유 LMS 헬퍼를 전면 교체하면 영향 범위가 너무 넓어서, D1를 원본으로 두고 기존 메모리 경로는 호환 레이어로 유지했다.

## 검증
- `npm --workspace @myway/backend run build`
