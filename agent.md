# MyWayClass 에이전트 가이드

## 목적
이 문서는 `MyWayClass` 저장소에서 일하는 AI의 메인 계약서다. 이 문서만 읽어도 작업을 시작할 수 있어야 한다.

## 문서 유형
원본 문서다. 공통 원칙, 읽는 순서, 작업 흐름, 하위 문서 진입점을 담는다.

## 최상위 원칙
- 문서는 먼저 읽고, 코드는 그 다음에 만진다.
- 문서와 코드가 다르면 문서를 먼저 바로잡는다.
- 요청받은 것만 구현하고, 범위를 넓히지 않는다.
- 고장 나지 않은 것을 리팩터링하지 않는다.
- 변경은 수술처럼 정확하게 한다.
- 변경 이유와 결과는 추적 가능하게 남긴다.
- 컨벤션과 작업 지시는 섞지 않는다.
- 관련 없는 문서는 건드리지 않는다.
- 파일 수정은 `apply_patch`를 우선한다.
- 실행 코드와 서비스 스크립트도 특별한 이유가 없으면 TypeScript를 우선한다.
- `.mjs`, `.cjs`, `.js`는 TypeScript로 해결할 수 없을 때만 쓰고, 이유를 문서에 남긴다.

## 프로젝트 요약
- 한글명: `내맘대로클래스`
- 영어명: `MyWayClass`
- 성격: 강의를 개인화된 숏폼 콘텐츠로 재구성하고, 학습자와 AI가 함께 더 나은 학습 콘텐츠를 만드는 플랫폼

## 구조 인덱스
- `frontend/` - 브라우저 UI, 화면 상태, 프론트 API 호출
- `backend/` - API, 서비스, Workers, DB 접근, AI 오케스트레이션
- `packages/shared/` - 프론트와 백엔드가 같이 쓰는 타입, DTO, enum, 공통 유틸
- `docs/` - 프로젝트 공통 설계 문서
- `frontend/docs/` - 프론트 전용 설계 문서
- `backend/docs/` - 백엔드 전용 설계 문서
- `docs/ops/agent/agent.md` - 운영용 companion doc
- `frontend/agent.md` - 프론트 폴더 맥락 규칙
- `backend/agent.md` - 백엔드 폴더 맥락 규칙

## 하위 메모리 인덱스
- `docs/ai-context/agent.md` - AI 협업, 지시 템플릿, 다답안 비교, 하네스 규칙
- `docs/ops/agent/agent.md` - 운영 체크, 브랜치, UTF-8, PR, 워크트리
- `frontend/agent.md` - 프론트 폴더 작업 규칙
- `backend/agent.md` - 백엔드 폴더 작업 규칙

## 읽는 순서
### 즉시 작업 시작
1. 이 문서
2. `docs/conventions/00-CONVENTIONS-CORE.md`
3. 작업 영역별 `agent.md` (`frontend/agent.md` 또는 `backend/agent.md`)

### 작업 유형별 추가 문서
- 프론트엔드 UI 작업: `docs/conventions/10-REACT-TYPESCRIPT-CORE.md`, `frontend/docs/README.md`
- 백엔드 API 작업: `docs/structure/backend/common/overview.md`, `backend/docs/README.md`
- 아키텍처 변경: `docs/context/architecture.md`, `docs/context/module-structure.md`
- AI 협업 세부: `docs/ai-context/agent.md`, `docs/ai-context/harness-engineering.md`
- 운영 체크: `docs/ops/agent/agent.md`

### 문서 추적 원칙
- 먼저 이 문서로 작업 목적을 확정한다.
- 필요한 정보만 읽고, 경로는 이 문서가 안내한 것만 따른다.
- 허브 문서를 열면 그 문서가 가리키는 다음 경로만 따른다.
- 새 허브를 발견해도 작업 목적과 무관하면 확장하지 않는다.

## 작업 흐름
### 1. 작업 시작 전
- 요청을 한 줄로 요약한다.
- 관련 모듈을 먼저 판단한다.
- 요청 범위를 MoSCoW로 분류한다.
- 필요한 문서만 읽고, 해당 `agent.md` 경로만 따라간다.
- 2안 비교가 필요한지 판단한다.

### 2. 작업 중
- 최소 변경 원칙을 지킨다.
- 기존 스타일을 유지한다.
- 단계별로 검증한다.

### 3. 작업 완료 전
- 빌드나 테스트를 확인한다.
- 문서를 바꿨으면 함께 갱신한다.
- `docs/dev-logs/`에 변경 요약을 남긴다.

## 작업 판단
- 불확실하면 가정을 숨기지 말고 적는다.
- 해석이 여러 가지면 조용히 하나를 고르지 말고 선택지를 낸다.
- 더 단순한 방법이 있으면 먼저 제안한다.
- 변경은 검증 가능한 목표로 바꿔서 이해한다.

## 협업 기준
- 한국어로 소통한다.
- 커밋 메시지는 영어로 작성한다.
- 설명은 직접적이고 구체적으로 한다.
- PR을 열기 전에는 `docs/dev-logs/`에 변경 요약을 남긴다.
- 원격 최신화는 `git pull --rebase` 또는 `git fetch` 후 `git rebase`로 한다.

## 2안 비교
### 필수 상황
- 새 파일이나 폴더를 만들 때
- API 설계나 데이터 형식을 정할 때
- 상태 관리 방식이 갈릴 때
- 에러 처리 전략을 정할 때
- 3개 이상 파일을 동시에 수정해야 할 때

### 생략 가능
- 단순 버그 수정
- 기존 패턴 반복
- 명백한 컨벤션 위반 수정

### 기록 기준
- 비교는 2안까지로 제한한다.
- 비교 기준은 `변경량 / 파일 수 / 검증 결과 / 파일 분리 적합성`이다.
- 선택 이유는 `docs/dev-logs/`에 남긴다.

## 프로젝트 정체성 반영
- 이 플랫폼은 학습자와 AI가 함께 더 나은 학습 콘텐츠를 만드는 쪽으로 설계한다.
- AI는 대체자가 아니라 보조자다.
- 자동 생성만으로 끝내지 말고, 사용자 수정과 검토 가능성을 남긴다.
- 데이터 구조와 UI도 검토 가능한 흐름을 우선한다.

## 작업 중단 신호
- 문서와 코드가 충돌하면 먼저 멈춘다.
- 기존 테스트가 깨지면 멈추고 원인을 정리한다.
- 3개 이상 파일 동시 수정이 예상되면 2안 비교 여부를 다시 본다.

## 역할 경계
### frontend/
- 브라우저 UI, 라우팅, 화면 상태, 사용자 입력 처리
- 세부 규칙은 `frontend/agent.md`와 `frontend/docs/`를 따른다.

### backend/
- HTTP API, 서비스 레이어, DB 접근, AI 오케스트레이션
- 세부 규칙은 `backend/agent.md`와 `backend/docs/`를 따른다.

### packages/shared/
- 공유 타입, DTO, enum, API envelope, 아주 작은 유틸
- UI 코드, DB 코드, Workers 코드는 넣지 않는다

### docs/
- 프로젝트 공통 설계와 기준 문서
- 세부 경계는 `docs/context/`, `docs/conventions/`, `docs/structure/`를 따른다

## 공통 규칙
- 검증 가능하고 추적 가능하게 변경한다.
- AI 출력은 가능한 한 구조화하고 fallback을 둔다.
- 검증 결과와 선택 이유는 문서에 남긴다.
- 구조 경계는 `docs/context/architecture.md`와 `docs/context/module-structure.md`를 따른다.
- 우선순위와 분리 기준은 `docs/conventions/01-MOSCOW-PRIORITY.md`, `docs/conventions/02-FOLDER-SPLIT-RULES.md`, `docs/conventions/03-FILE-SPLIT-RULES.md`를 따른다.
- TypeScript 세부 규칙은 `docs/conventions/10-REACT-TYPESCRIPT-CORE.md`를 따른다.

## 출력 기준
- 변경이 있으면 무엇을 왜 바꿨는지 짧고 분명하게 설명한다.
- 파일 경로는 절대 경로로 적는다.
- 여러 선택지가 있으면 짧은 순서형 목록으로 제시한다.
- 불완전하면 남은 일을 명시한다.

## 실패 모드
- 문서와 코드가 서로 다르게 말하는 상태
- 범위를 넓혀서 생기는 불필요한 변경
- `any` 남용
- 과도한 추상화
- 무거운 기능을 무료 환경에 그대로 넣는 것
- AI 출력이 검증되지 않은 채로 노출되는 것

## companion 문서
- `docs/ops/agent/agent.md`는 짧은 운영용 요약본이다.
- 메인 규칙은 이 문서를 우선한다.
- companion doc가 있어도 이 문서와 충돌하면 이 문서를 따른다.
