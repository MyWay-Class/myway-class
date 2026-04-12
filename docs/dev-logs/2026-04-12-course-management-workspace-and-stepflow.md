# 2026-04-12 강의 관리 탭과 2단계 개설 워크플로우

## 왜 바꿨는지
- 강의 목록, 강의 개설, 강의 제작 스튜디오, 미디어 파이프라인이 흩어져 있어서, 교수와 강사가 실제로 쓰는 흐름이 끊겨 보였다.
- 강의 개설은 정보를 먼저 입력하고, 다음 단계에서 개설을 확정한 뒤 자동으로 업로드와 STT가 이어지는 구조가 더 자연스러웠다.
- `미디어 파이프라인` 화면은 개설 흐름의 필수 화면이 아니라 운영용 세부 상태에 가깝기 때문에 기본 메뉴에서 빼는 편이 맞았다.

## 무엇을 바꿨는지
- `frontend/src/features/lms/types.ts`에 `my-courses` 페이지를 추가했다.
- `frontend/src/features/lms/config.ts`에서 교수/강사 기본 진입점을 `내 강의 관리`로 바꾸고, 메뉴에 `내 강의 관리`를 넣었다.
- `frontend/src/features/lms/pages/MyCoursesPage.tsx`를 새로 만들어 내가 관리하는 강의를 한곳에서 보고, `강의 개설`과 `강의 제작 스튜디오`로 바로 이동할 수 있게 했다.
- `frontend/src/features/lms/pages/CourseCreatePage.tsx`를 2단계 워크플로우로 정리해서, 첫 화면에서 입력을 저장하고 다음 단계에서 강의 개설을 확정하도록 바꿨다.
- `frontend/src/features/lms/components/CourseCreateCard.tsx`를 prepare 모드에 맞게 바꿔서, 첫 단계는 `다음`으로 저장만 하고 마지막 단계에서만 실제 개설이 되게 했다.
- `frontend/src/features/lms/pages/RolePageRouter.tsx`에서 `my-courses` 페이지를 실제로 렌더링하도록 연결했다.
- `backend/src/routes/courses.ts`에 `GET /api/v1/courses/manage`를 추가해서 관리 중인 강의 목록을 별도로 조회할 수 있게 했다.
- `frontend/src/features/lms/pages/CoursesPage.tsx`에 `내 강의 관리` 바로가기 버튼을 넣어 목록에서 관리 페이지로 자연스럽게 이동하게 했다.

## 어떻게 검증했는지
- `npm run verify`를 실행해 backend, media processor, frontend 타입 검사를 모두 통과시켰다.

## 판단
- 강의 관리와 강의 개설은 서로 다른 목적이므로, 별도 탭으로 나누는 편이 작업 시작과 복귀가 쉽다.
- 개설 폼을 한 번 입력한 뒤 다음 단계로 넘기고, 마지막에만 확정하는 방식이 사용자 실수와 재입력을 줄인다.
- 배포 버전에서는 일반 사용자가 내부 처리 화면을 볼 이유가 없으므로, `미디어 파이프라인`은 기본 메뉴에서 빼는 편이 맞다.
