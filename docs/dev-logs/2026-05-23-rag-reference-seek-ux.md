# 2026-05-23 RAG Reference Seek UX

## 배경
- 챗봇 reference의 타임스탬프 클릭은 가능했지만, 다른 강의 reference를 클릭했을 때의 전환/seek 동작이 명확하지 않았다.
- seek 실패 시 fallback 경로가 없어 사용자가 다음 액션을 판단하기 어려웠다.

## 변경 내용
- `AIChatThread`
  - `onSeekTimestamp(startMs, lectureId?)` 시그니처로 확장
  - reference의 `lecture_id`를 함께 전달
- `LectureSideChatPanel`
  - 상위로 `lectureId` 포함 seek 콜백 전달
- `LectureWatchPage`
  - 같은 강의 reference: 즉시 seek
  - 다른 강의 reference:
    - 현재 코스에 존재하면 `onSelectLecture` 후 pending seek 저장
    - 강의 전환 완료 후 자동 seek 실행
    - 현재 코스에 없으면 강의 상세 페이지(`courses`)로 fallback 이동

## 검증
- `npm run build:frontend` 통과
- `npm --workspace @myway/frontend run test` 통과

## 리스크/롤백
- 리스크: reference에 `lecture_id`가 없는 응답은 기존과 동일하게 현재 강의 기준 seek 처리.
- 롤백: 해당 커밋 revert 시 기존 단일 강의 seek 동작으로 복귀.
