## 인텐트와 NLU 구조

## 목적
어시스턴트가 사용자 의도를 해석하고 행동을 라우팅하는 방식을 정의한다.

## 범위
- 로컬 규칙
- 에이전트 분석
- 질의 분해
- 엔티티 추출

## 입력
- 사용자 메시지
- 강의 또는 수업 맥락
- 대화 이력

## 출력
- 인텐트
- 신뢰도
- 엔티티
- 행동 결정

## 규칙
- 로컬 규칙을 먼저 실행한다.
- 에이전트 분석은 필요할 때만 사용한다.
- 복합 질문은 분해한다.
- 신뢰도는 출력에 보존한다.

## 인텐트 집합
- `ask_concept`
- `request_summary`
- `generate_quiz`
- `search_content`
- `ask_recommendation`
- `explain_deeper`
- `translate`
- `compare`
- `create_shortform`
- `extract_audio`
- `analyze_progress`
- `generate_flashcard`
- `general_chat`

## 에이전트 행동
- `SEARCH`
- `DIRECT_ANSWER`
- `CLARIFY`
- `DECOMPOSE`
- `WEB_SEARCH`

## 예외 상황
- 여러 인텐트가 겹치면 우선순위를 사용한다.
- 애매한 질문은 답변보다 확인을 선택할 수 있다.

## 실패 모드
- 숏폼 요청을 엉뚱한 흐름으로 보내는 경우
- 강의 맥락을 무시하는 경우
- 단순한 대화를 지나치게 복잡하게 처리하는 경우

## 검증 기준
- 이 프로젝트의 일반적인 사용자 행동을 라우팅할 수 있다.
- 인텐트 출력이 로그와 분석에 유용하다.
