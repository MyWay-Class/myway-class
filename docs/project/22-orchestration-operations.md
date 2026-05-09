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

## 운영 수칙
- 오케스트레이션 결과는 `_workspace/decision.json`, `_workspace/scorecard.json`, `_workspace/logs/*.jsonl`로 추적한다.
- `request_changes` 또는 `rejected` 시 원인 워커 리포트(`_workspace/reports/*.json`)를 우선 확인한다.
- 임시/산출물 파일(`_workspace/`, `.github/.tmp_*`, `backend-spring/target/`)은 커밋하지 않는다.

## 실행 예시
1. strict 기본 검증
- `set ORCH_PROFILE=strict && npm run orch:run`

2. 체크만 빠르게 확인
- `set ORCH_PROFILE=strict && npm run orch:checks`

3. 로컬 빠른 확인(예외)
- `set ORCH_PROFILE=baseline && npm run orch:run`
