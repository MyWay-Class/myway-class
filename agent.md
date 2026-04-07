# MyWayClass 에이전트 가이드

## 목적
이 문서는 `MyWayClass` 저장소에서 일하는 AI의 메인 작업 지침서다.
다른 문서를 먼저 읽지 않아도, 이 문서만으로 다음 작업을 시작할 수 있어야 한다.

## 프로젝트 정체성
- 한글명: `내맘대로클래스`
- 영어명: `MyWayClass`
- 프로젝트 성격: 강의를 개인화된 숏폼 콘텐츠로 재구성하고, 학습자와 AI가 함께 더 나은 학습 콘텐츠를 만드는 플랫폼

## 기본 스택
- 프론트엔드: `TypeScript + React + Vite`
- 백엔드: `TypeScript + Hono + Cloudflare Workers`
- 데이터베이스: `Cloudflare D1`
- 파일 저장소: `Cloudflare R2`
- 배포: `Cloudflare Pages + Workers`
- 공통 계약: `packages/shared`

## 표준 작업 공간 구조
- `frontend/` - 브라우저 UI, 화면 상태, 프론트 API 호출
- `backend/` - API, 서비스, Workers, DB 접근, AI 오케스트레이션
- `packages/shared/` - 프론트와 백엔드가 같이 쓰는 타입, DTO, enum, 공통 유틸
- `docs/` - 프로젝트 공통 설계 문서
- `frontend/docs/` - 프론트 전용 설계 문서
- `backend/docs/` - 백엔드 전용 설계 문서
- `docs/ops/agent/agent.md` - 짧은 운영용 companion doc
- `infra/` - 배포/환경/클라우드 설정이 필요할 때만 사용

## 읽는 순서
이 문서는 단독 실행이 가능해야 하지만, 필요할 때 아래 문서들을 참고하면 더 정확하다.
정보가 더 필요하면 이 문서가 안내한 경로만 따라간다. 다른 문서를 임의로 찾아다니지 않고, 각 단계마다 `agent.md`의 목적과 작업 범위를 다시 확인한다.

1. `docs/README.md`
2. `docs/project/00-index.md`
3. `docs/context/README.md`
4. `docs/context/architecture.md`
5. `docs/context/module-structure.md`
6. `docs/conventions/README.md`
7. `docs/conventions/00-CONVENTIONS-CORE.md`
8. `docs/conventions/01-MOSCOW-PRIORITY.md`
9. `docs/conventions/02-FOLDER-SPLIT-RULES.md`
10. `docs/conventions/03-FILE-SPLIT-RULES.md`
11. `docs/conventions/04-BRANCH-CONVENTIONS.md`
12. `docs/conventions/09-GITHUB-ACTION-CHECKS.md`
13. `docs/structure/README.md`
14. `docs/structure/backend/common/overview.md`
15. `docs/dev-logs/README.md`
16. `docs/ai-context/harness-engineering.md`
17. `frontend/docs/README.md`
18. `backend/docs/README.md`

### 문서 추적 원칙
- 먼저 `agent.md`를 읽고 작업 목적을 확정한다.
- 필요한 정보가 부족하면 `agent.md`가 지정한 다음 경로만 연다.
- 허브 문서를 열었을 때는 그 문서가 가리키는 다음 경로만 따라간다.
- 새 허브를 발견해도 작업 목적과 무관하면 즉시 확장하지 않는다.
- 정보 수집이 끝나면 다시 `agent.md` 기준으로 작업으로 돌아온다.

## 작업 원칙

### 1. 코딩 전에 먼저 생각한다
- 구현 전에 가정은 명시적으로 밝힌다.
- 불확실하면 먼저 질문하거나, 최소한 어떤 부분이 불확실한지 분명히 말한다.
- 해석이 여러 가지 가능하면 조용히 하나를 고르지 말고 선택지를 제시한다.
- 더 단순한 방법이 있으면 제안하고, 필요하면 반대 의견도 낸다.

### 2. 단순함을 우선한다
- 요청받은 것만 구현한다.
- 추측성 기능, 설정 가능성, 유연성은 요청이 없으면 추가하지 않는다.
- 한 번만 쓰이는 코드에 불필요한 추상화를 만들지 않는다.
- 발생하지 않을 시나리오에 대한 과도한 방어 코드는 넣지 않는다.
- 더 짧고 명확한 방식이 있으면 그 방식을 우선한다.

### 3. 수술처럼 정확하게 변경한다
- 인접 코드, 주석, 포매팅을 괜히 개선하지 않는다.
- 고장 나지 않은 것을 리팩터링하지 않는다.
- 기존 코드 스타일은 내 선호와 다르더라도 그대로 따른다.
- 내 변경으로 더 이상 필요 없어졌을 때만 import, 변수, 함수를 제거한다.
- 기존 dead code는 요청이 없으면 삭제하지 말고, 필요하면 언급만 한다.
- 변경된 모든 줄은 사용자 요청과 직접 연결돼야 한다.

### 4. 목표 중심으로 실행한다
- 작업은 검증 가능한 목표로 바꿔서 이해한다.
- 다단계 작업은 단계별 계획과 검증 기준을 분명히 한다.
- 검증될 때까지 반복하고, 성급하게 완료 선언하지 않는다.
- 가능하면 테스트, 빌드, 실행 결과로 마무리 여부를 확인한다.
- 작업 범위는 매번 MoSCoW로 분류하고, `Must`가 아니면 이번 작업에 넣지 않는다.
- 폴더와 파일을 나눌 때는 `docs/conventions/02-FOLDER-SPLIT-RULES.md`와 `docs/conventions/03-FILE-SPLIT-RULES.md`를 따른다.

## 협업 규칙
- 한국어로 소통한다.
- 커밋 메시지는 영어로 작성한다.
- 브랜치명과 기술 식별자는 영어를 사용할 수 있다.
- 설명은 직접적이고 구체적으로 한다.
- 중요한 가정은 먼저 밝히고 작업한다.
- 불확실하면 불확실하다고 분명히 말한다.
- 사용자가 명시적으로 원하지 않은 방향으로 범위를 넓히지 않는다.
- PR을 열기 전에는 `docs/dev-logs/`에 변경 요약을 남긴다.

## 작업 규칙
1. 작업은 작은 단위로 나눠서 변경한다.
2. 기존 동작은 보존하고, 관련 없는 문서는 건드리지 않는다.
3. 파일 수정은 `apply_patch`를 우선 사용한다.
4. 문서와 코드의 실제 구현이 일치해야 한다.
5. 무료 API가 없더라도 전체 흐름은 유지되어야 한다.
6. AI 출력은 검증 가능하고 추적 가능해야 한다.
7. 문서가 너무 길어지면 분리한다.
8. `docs/ops/agent/agent.md`는 짧고 읽기 쉽게 유지한다.
9. 대부분의 문서는 200라인 이하로 유지하고, 길어지면 압축하거나 companion doc로 분리한다.
10. PR마다 변경 기록을 `docs/dev-logs/`에 남긴다.

## 인코딩
- PowerShell에서 한글이 깨질 때는 먼저 UTF-8 콘솔 설정을 적용한다.
- 파일 저장은 UTF-8을 사용한다.
- 새 문서를 만들거나 수정할 때 인코딩이 흔들리면 저장 방식을 먼저 확인한다.

### PowerShell UTF-8 설정
```powershell
chcp 65001 > $null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
```

## TypeScript 스타일
- Type inference를 기본으로 사용한다.
- `any`는 금지하고, `unknown`을 먼저 사용한다.
- 외부 입력은 경계에서 검증하고 내부 로직으로 넘긴다.
- 객체 계약에는 `interface`, union과 계산 타입에는 `type`을 우선한다.
- `enum`은 꼭 필요할 때만 쓴다.
- nullability는 명시적으로 표현한다.
- public contract는 명확하게 export 한다.
- 함수는 작고 직접적으로 유지한다.
- comments는 동작이 아니라 의도와 이유를 설명할 때만 쓴다.

## 모듈 책임

### frontend/
- 화면, 라우팅, UI 상태, 브라우저 이벤트 처리
- 서버 상태 조회와 사용자 입력 수집
- 프론트 전용 컴포넌트와 스타일

### backend/
- HTTP API, 서비스 레이어, DB 접근
- AI 요청 오케스트레이션
- RAG, STT, 인텐트, 숏폼 생성, 커뮤니티 로직
- 인증, 권한, 검증, 로깅

### packages/shared/
- 프론트와 백엔드가 공유하는 타입과 DTO
- 공통 enum, status, API envelope, 아주 작은 유틸
- UI 코드, DB 코드, Workers 코드는 넣지 않는다

### docs/
- 프로젝트 공통 설계
- 기술스택, 아키텍처, API, RAG, 인텐트, STT, 숏폼, AI 비용 전략, 컨벤션, 검증

## AI 구현 규칙
- AI 기능은 검증 가능하고 추적 가능해야 한다.
- AI 출력은 가능한 한 구조화한다.
- RAG, STT, 인텐트, 숏폼 생성은 각각 독립된 책임으로 나눈다.
- 무료 AI가 없더라도 흐름이 끊기지 않도록 fallback을 둔다.
- 추적을 위해 provider, latency, success/failure, token 관련 정보를 기록한다.
- LLM 사용 방식은 `docs/ai-context/agent.md`의 지시 가중치 규칙을 따른다.
- 실험용 기능과 운영용 기능은 문서와 코드에서 구분하고, 하네스 원칙은 `docs/ai-context/harness-engineering.md`를 따른다.
- 작업 전에는 `docs/context/architecture.md`와 `docs/context/module-structure.md`로 구조 경계를 확인한다.
- 우선순위 판단은 `docs/conventions/01-MOSCOW-PRIORITY.md`를 따른다.
- 폴더 분리와 파일 분리는 `docs/conventions/02-FOLDER-SPLIT-RULES.md`, `docs/conventions/03-FILE-SPLIT-RULES.md`를 따른다.

## 실행 순서
1. 작업 유형을 확인한다.
2. 관련 문서만 읽는다.
3. 필요한 범위만 수정한다.
4. 빌드나 테스트가 있으면 먼저 확인한다.
5. 변경 후 결과를 검증한다.
6. 문서가 바뀌면 함께 갱신한다.

## 출력 기준
- 변경이 있으면 무엇을 왜 바꿨는지 짧고 분명하게 설명한다.
- 파일 경로를 언급할 때는 절대 경로를 사용한다.
- 여러 선택지가 있으면 짧은 순서형 목록으로 제시한다.
- 작업이 불완전하면 무엇이 남았는지 명시한다.

## 피해야 할 실패 모드
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
