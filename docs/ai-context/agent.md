# AI 에이전트 규칙

## 목적
다른 AI가 이 저장소에서 어떻게 작업해야 하는지 알려준다.
이 파일은 AI 협업 변경을 위한 간단한 작업 합의서다.

## 읽는 순서
1. `docs/README.md`
2. `docs/project/00-index.md`
3. `docs/context/README.md`
4. `docs/conventions/README.md`
5. `docs/structure/README.md`
6. `docs/templates/README.md`
7. `docs/dev-logs/README.md`
8. `docs/ai-context/harness-engineering.md`
9. `frontend/docs/README.md`
10. `backend/docs/README.md`
11. `docs/context/architecture.md`
12. `docs/context/module-structure.md`
13. `docs/conventions/00-CONVENTIONS-CORE.md`
14. `docs/conventions/01-MOSCOW-PRIORITY.md`
15. `docs/conventions/02-FOLDER-SPLIT-RULES.md`
16. `docs/conventions/03-FILE-SPLIT-RULES.md`
17. `docs/conventions/04-BRANCH-CONVENTIONS.md`
18. `docs/conventions/09-GITHUB-ACTION-CHECKS.md`
19. `docs/structure/backend/common/overview.md`
20. `docs/templates/project-specification.md`
21. `docs/templates/task-workflow.md`

## 규칙
- 코딩 전에 먼저 생각한다.
- 요청받은 것만 구현한다.
- 변경은 수술처럼 정확하고 국소적으로 진행한다.
- 목표를 만족하는 가장 단순한 해결책을 우선한다.
- 문서에 적힌 스택과 모듈 경계를 존중한다.
- 관련 문서를 갱신하지 않은 채 새로운 아키텍처를 만들지 않는다.
- 계약이 바뀌면 같은 작업 흐름에서 대응 문서도 함께 수정한다.
- 테스트, 빌드, 로컬 점검이 가능하면 결과를 검증한다.

## 협업 방식
- 결과에 영향을 주는 가정은 명시적으로 밝힌다.
- 작업이 애매하면 조용히 추측하지 말고 애매한 점을 드러낸다.
- 대화는 한국어로 하고, 산출물이 요구할 때만 영어를 쓴다.
- 설명은 명확하고 직접적이며 목표 지향적으로 한다.

## 강한 제약
- 관련 없는 코드는 리팩터링하지 않는다.
- 추측성 기능은 추가하지 않는다.
- 수정에 꼭 필요한 경우가 아니면 요청 범위를 벗어난 코드 스타일 변경은 하지 않는다.
- 문서와 코드가 서로 충돌한 채로 저장소를 남기지 않는다.

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

## 인코딩
- PowerShell에서 한글이 깨질 때는 먼저 UTF-8 콘솔 설정을 적용한다.
- 파일 저장은 UTF-8을 사용한다.
- 새 문서를 만들거나 수정할 때 인코딩이 흔들리면 저장 방식을 먼저 확인한다.

## PowerShell UTF-8 설정
```powershell
chcp 65001 > $null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
```

## 실행 순서
1. 작업 유형을 확인한다.
2. 관련 문서만 읽는다.
3. 필요한 범위만 수정한다.
4. 빌드나 테스트가 있으면 먼저 확인한다.
5. 변경 후 결과를 검증한다.
6. 문서가 바뀌면 함께 갱신한다.
