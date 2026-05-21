# Course session timeline overhaul

**날짜**: 2026-04-09  
**관련 이슈**: #85  
**브랜치**: `fix/85-course-timeline-b`

## 변경 요약
- 강의 상세 화면을 레퍼런스 v0.4.0의 주차/차시 구분 디자인에 맞춰 다시 정리했다.
- `week_number`, `session_number` 기반으로 강의를 그룹화해 주차별 타임라인을 렌더링했다.
- 완료된 차시에는 `완료` 배지를 붙이고, 선택된 차시는 강조 상태로 보여주도록 했다.
- 오른쪽 상세 패널은 코스 요약 카드, 탭, 타임라인 순서로 재배치했다.

## 왜 B안을 선택했는가
- 레퍼런스는 단순한 리스트가 아니라 `주차 헤더 + 좌측 타임라인 + 차시 배지` 구조가 핵심이었다.
- B안은 데이터 모델에 `week_number`와 `session_number`를 명시해서 화면 구조와 정보 구조를 함께 맞출 수 있었다.
- A안처럼 화면에서만 추론하면 레퍼런스의 차시 표현과 이후 확장성이 흔들릴 수 있어서, B안이 더 안전하고 자연스러웠다.

## 바뀐 파일
- `packages/shared/src/types/lms.ts`
- `packages/shared/src/data/courses.ts`
- `packages/shared/src/lms/learning/course.ts`
- `packages/shared/src/lms/learning/catalog.ts`
- `frontend/src/features/lms/components/CourseSessionTimeline.tsx`
- `frontend/src/features/lms/pages/CoursesPage.tsx`

## 확인 포인트
- 강의 목록은 `week_number` 기준으로 그룹화된다.
- 차시는 `session_number` 우선, 없으면 `order_index + 1`로 표시된다.
- 완료된 강의는 체크 아이콘과 `완료` 배지로 표시된다.
- 강의 상세 화면은 레퍼런스처럼 상단 요약 카드와 탭, 하단 콘텐츠로 나뉜다.
- 타입체크는 `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`로 통과했다.
