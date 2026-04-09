# 2026-04-09 event persistence A/B compare

## 변경 요약
- 활동 타임라인과 AI 로그가 런타임 중 누적되도록 append 기반 구조를 추가했다.
- A/B 워킹트리를 비교한 뒤 A안을 선택했다.

## 배경
- `#71`은 활동 타임라인과 AI 로그를 누적 기록할 수 있게 만드는 작업이다.
- 기존 구조는 demo 배열을 읽기 전용처럼 쓰는 부분이 많아서, 같은 실행 세션 안에서 기록이 계속 쌓이도록 정리할 필요가 있었다.
- 워킹트리 분기를 써서 더 넓은 저장소 분리안과 최소 변경안을 비교했다.

## 변경 내용
- `backend/src/routes/ai.ts`
  - AI intent, search, answer, summary, quiz 요청 후 사용자 로그를 append 방식으로 누적한다.
  - 답변 로그는 강의 메타를 조회해서 `lecture_id`와 `course_id`를 함께 남긴다.
  - 사용자 인증이 없으면 로그 기록은 건너뛴다.
- `packages/shared/src/data/ai-logs.ts`
  - `appendAIUsageLog`, `appendAIIntentLog`, `appendAIQuestionLog`를 추가했다.
  - 기존 demo 배열에 push해서 대시보드와 로그 조회가 같은 데이터를 다시 보도록 맞췄다.
- `docs/project/20-status-and-next-steps.md`
  - 활동/AI 로그 누적 기록 기반과 데이터 지속성 판단 기준을 갱신했다.

## 연결 이슈
- Closes #71

## 검증
- `npm run build:backend`

## 코드리뷰
- 로그 append는 현재 런타임 메모리 기준이다.
- 실제 DB/외부 저장소로 옮길 때는 append helper만 교체할 수 있도록 구조를 얇게 유지했다.

## 체크 사항
- [x] A/B 비교 후 A안 선택
- [x] dev log 작성
- [x] backend 빌드 확인
- [x] 이슈 연결
