# 오케스트레이션 운영 기준

## 목적
- `orchestration-gate`를 통해 `dev` 브랜치 병합 전에 자동 검증/판정을 강제한다.

## 실행 프로필
- 기본값: `strict`
- 예외값: `baseline`

## strict 사용 기준
- PR 검증, 병합 전 최종 검증, 릴리즈 직전 검증에 사용한다.
- 필수: 백엔드 테스트(`npm run test:backend`) 통과, 오케스트레이터 최종 상태 `approved`.

## baseline 사용 기준
- 로컬 빠른 확인 또는 일시적 환경 제약(예: 외부 의존 서비스 장애)에서만 사용한다.
- `baseline` 결과만으로 `dev` 머지를 승인하지 않는다.

## 필수 머지 조건(`dev`)
- GitHub required check: `gate` (`orchestration-gate` 워크플로우)
- Conversation resolution 완료
- Gate 코멘트에는 `requestChangeCodes`, `nextActions`가 포함된다.
- 자동 승인(AI review)은 `dev` 대상 PR에서만 시도한다(`main` 제외).
- `SLACK_WEBHOOK_URL` GitHub Secret이 설정된 경우 gate 실패 시 Slack 알림을 전송한다.

## 운영 수칙
- 오케스트레이션 결과는 `_workspace/decision.json`, `_workspace/scorecard.json`, `_workspace/logs/*.jsonl`로 추적한다.
- 실패 시 `_workspace/remediation.json`에 `requestChangeCodes` 기반 수정 가이드(담당/액션)가 생성된다.
- 각 실행에는 `traceId`가 발급되며, `decision.json`/감사 로그/PR gate 코멘트에 동일하게 기록된다.
- GitHub Actions `orchestration-gate`는 실행마다 핵심 `_workspace` 산출물을 아티팩트로 업로드한다(보관 14일).
- `request_changes` 또는 `rejected` 시 원인 워커 리포트(`_workspace/reports/*.json`)를 우선 확인한다.
- 실패가 발생하면 정책(`ops/workflow/policy.yaml`)의 `debate.max_rounds` 범위 내에서 1회 재토론/재실행 후 최종 판정한다.
- 임시/산출물 파일(`_workspace/`, `.github/.tmp_*`, `backend-spring/target/`)은 커밋하지 않는다.

## 멀티에이전트 런타임 모드
- `local`(기본): 오케스트레이터가 로컬 커맨드 기반 워커를 직접 실행한다.
- `remote`: 오케스트레이터가 외부 에이전트 API를 호출해 워커/토론을 위임한다.
- 우선순위: 환경변수(`ORCH_AGENT_MODE`, `ORCH_AGENT_ENDPOINT`) > `ops/workflow/policy.yaml.agent_runtime`.

## remote API 계약(최소)
1. 워커 실행
- `POST {ORCH_AGENT_ENDPOINT}/workers/run`
- 요청 필드: `taskId`, `role`, `profile`, `projectDir`, `timeoutMs`, `filesChangedHint`
- 응답 필드: `summary`, `filesChanged[]`, `risks[]`, `pass`, `messages[]`, `executionPlan`

2. 토론 라운드(선택)
- `POST {ORCH_AGENT_ENDPOINT}/debate/round`
- 요청 필드: `taskId`, `profile`, `optionA`, `optionB`, `optionC(선택)`
- 응답 필드: `chosen(A|B|C)`, `rationale`, `messages[]`

## 로컬 에이전트 런타임 서버 실행
1. 서버 시작
- `npm run agent-runtime:start`
- 기본 주소: `http://127.0.0.1:8787`
- 운영 파라미터:
  - `AGENT_RUNTIME_CONCURRENCY` (기본 `1`)
  - `AGENT_RUNTIME_COMMAND_RETRIES` (기본 `1`)
  - `AGENT_RUNTIME_QUEUE_TIMEOUT_MS` (기본 `120000`)

2. 오케스트레이터를 remote 모드로 실행
- `set ORCH_AGENT_MODE=remote`
- `set ORCH_AGENT_ENDPOINT=http://127.0.0.1:8787`
- `npm run orch:run`

## request_changes 코드 표준
- 실패 시 `decision.json.requestChangeCodes`에 구조화 원인 코드를 기록한다.
- 예: `WORKER_BACKEND_FAILED`, `CHECK_TESTS_FAILED`, `REMOTE_RUNTIME_UNAVAILABLE`
- 재라운드 진입 시 `requestChangeCodes`별 부분 복구 명령(예: 테스트 재실행, 보안 감사, 빌드 스모크)을 자동 실행한 뒤 재판정한다.

## Safe Auto-Fix (옵트인)
- 기본값 비활성: `ops/workflow/policy.yaml.autofix.enabled: false`
- 활성화 방법:
  - 정책 변경: `autofix.enabled: true`, `autofix.mode: safe`
  - 또는 일회성: `set ORCH_AUTOFIX=1`
- safe 모드에서는 allowlist 명령만 실행한다(예: `npm audit fix --package-lock-only`).

## Reviewer fail-fast
- `review-rules*.yaml`의 `required.<metric>.fail_fast: true`인 항목이 기준 미달이면 총점과 무관하게 즉시 `reject`한다.
- 결과는 `scorecard.required_failed`, `scorecard.fail_fast_triggered`에 기록된다.

## 실행 예시
1. strict 기본 검증
- `set ORCH_PROFILE=strict && npm run orch:run`

2. 체크만 빠르게 확인
- `set ORCH_PROFILE=strict && npm run orch:checks`

2-1. 운영 요약 리포트
- `npm run orch:report`
- 출력: 최신 decision(traceId 포함), 상태 분포, requestChangeCodes Top N, 자동복구 성공률

3. 로컬 빠른 확인(예외)
- `set ORCH_PROFILE=baseline && npm run orch:run`

4. 원격 멀티에이전트 실행
- `set ORCH_AGENT_MODE=remote && set ORCH_AGENT_ENDPOINT=https://your-agent-runtime.example && npm run orch:run`
