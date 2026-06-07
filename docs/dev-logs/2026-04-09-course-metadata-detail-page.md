# 2026-04-09 코스 메타데이터 상세 페이지

## 한줄 요약
코스 카드와 강의 상세에 썸네일 팔레트, 평점, 수강생 수, 총 러닝타임, 비디오 URL, transcript excerpt, keywords를 추가하고 상세 페이지를 확장했다.

## 구현 내용
- `CourseCard`에 `thumbnail_palette`, `rating`, `student_count`, `total_duration_minutes`를 추가했다.
- `LectureDetail`에 `video_url`, `transcript_excerpt`, `keywords`를 추가했다.
- shared learning helper에서 코스/강의 메타데이터를 계산하도록 정리했다.
- `CoursesPage`를 카드형 상세 레이아웃으로 바꿔 코스 목록, 코스 상세, 강의 상세, 강의 목록을 한 화면에서 볼 수 있게 했다.
- `RolePageRouter`와 `LmsDashboard`에서 새 상세 props를 전달하도록 연결했다.

## 검증
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit` 통과
- `npm run build:backend`는 현재 환경에서 `@cloudflare/workers-types` 타입 정의를 찾지 못해 실패

