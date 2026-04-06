## 인텐트와 NLU 구조

## 목적
어시스턴트가 사용자 의도를 해석하고 행동을 라우팅하는 방식을 정의한다.

## 선택 이유
- 같은 문장이라도 "요약", "설명", "비교", "숏폼 생성"처럼 서로 다른 행동이 필요하다.
- 인텐트를 먼저 분류해야 요약, 검색, 숏폼, 챗봇이 섞이지 않는다.
- 교육 도메인에서는 사용자가 말을 길게 하거나 애매하게 말하는 일이 많아서, 단순 키워드보다 의도 해석이 중요하다.

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
- confidence가 낮으면 바로 실행하지 않고 확인 질문을 우선한다.
- 엔티티는 인텐트와 함께 기록해서 추적 가능하게 만든다.

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

## 기준값
- `request_summary`는 요약 화면과 복습 흐름으로 보낸다.
- `create_shortform`는 숏폼 생성 흐름으로 보낸다.
- `search_content`는 RAG 검색으로 연결한다.
- `general_chat`은 강의 맥락이 약한 경우에만 허용한다.
- confidence가 애매하면 `CLARIFY`를 우선한다.

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
