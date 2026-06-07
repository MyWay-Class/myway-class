# 2026-04-13 AI transcript corpus policy A/B comparison

## 변경 요약
- `#150`의 AI 검색/인텐트/답변/요약 연결을 A/B 워킹트리로 비교했다.
- A안은 `createAISummary`와 `generateAIQuiz`만 전사 본문 우선으로 바꾸는 최소 수정이었다.
- B안은 강의 전사/요약/본문을 하나의 `lecture source snapshot`으로 묶고, 검색 reference 순서도 transcript 우선으로 재정렬하는 방식이었다.

## 선택 결과
- B안을 채택했다.

## 선택 이유
- 검색과 요약이 서로 다른 소스 우선순위를 쓰면, 사용자는 같은 강의를 두 번 물어도 다른 근거를 받는다고 느낄 수 있다.
- B안은 transcript, note, lecture 본문을 하나의 snapshot으로 묶어서 `summary/quiz`와 `search/answer`가 같은 기준을 보게 만든다.
- transcript를 앞에 두기 때문에 STT가 쌓일수록 검색 품질이 자연스럽게 올라간다.

## 제외한 방향
- A안은 수정 범위가 작지만, summary/quiz만 고치고 검색 corpus 순서는 그대로 남겨서 일관성이 약하다.
- 기능별로 source order가 갈라지면 이후 디버깅과 품질 개선이 다시 복잡해진다.
