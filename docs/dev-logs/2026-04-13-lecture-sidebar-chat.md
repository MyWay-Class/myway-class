# 2026-04-13 Lecture Sidebar Chat

- `frontend/src/features/lms/pages/CoursesPage.tsx` 오른쪽 상세 패널 아래에 강의 전용 사이드 챗봇을 붙였다.
- `frontend/src/features/lms/components/LectureSideChatPanel.tsx`를 추가해서 선택한 강의의 제목, 차시, 강사 정보를 함께 보여주고 바로 질문할 수 있게 했다.
- `packages/shared/src/ai/intent/pipeline.ts`와 `packages/shared/src/ai/intent/helpers.ts`의 보수적 답변 규칙을 그대로 활용해서, 강의 맥락에 맞는 질문을 우선 처리한다.
- 세션 토큰을 상위에서 내려받아 로그인 상태로 `smart/chat`를 호출한다.
