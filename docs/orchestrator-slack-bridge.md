# Orchestrator Slack Bridge

## 목적
- 오케스트레이터(`tools/orchestrator/run.ts`) 실행 중 생성되는 토론 로그(`_workspace/threads/<taskId>.jsonl`)를 Slack 스레드에 실시간으로 전송합니다.
- 실행 종료 후 `decision.json`, `scorecard.json` 요약을 같은 스레드에 게시합니다.

## 환경 변수
- `SLACK_BOT_TOKEN` (필수): Slack Bot OAuth Token (`xoxb-...`)
- `SLACK_CHANNEL_ID` (필수): 메시지를 보낼 채널 ID (`C...`)
- `ORCH_PROFILE` (선택): 기본 `strict`
- `ORCH_TARGET_BRANCH` (선택): 기본 `dev`
- `TASK_ID` (선택): 미지정 시 자동 생성

## 실행
```bash
npm run orch:slack
```

옵션:
```bash
npm run orch:slack -- --profile strict --target dev --task-id task-20260510-001
```

## 동작 순서
1. Slack 채널에 "orchestration started" 헤더 메시지 생성
2. `npm run orch:run` 실행
3. `_workspace/threads/<taskId>.jsonl`를 주기적으로 읽어 새 발언을 Slack thread reply로 전송
4. 실행 종료 후 `decision.json` + `scorecard.json` 요약 게시

## Slack 권한(scope)
- `chat:write`
- (선택) `channels:history`, `groups:history` (향후 Slack 이벤트 기반 확장 시 사용)

## 참고
- 현재 브리지는 "토론 표시/중계" 용도입니다.
- Slack slash command/event 기반 양방향 제어(예: `/orch`)는 별도 webhook 서버를 추가해 연동할 수 있습니다.

