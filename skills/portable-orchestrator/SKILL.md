---
name: portable-orchestrator
description: "현재 레포의 오케스트레이션 자동화(ops/workflow, orchestrator runtime, CI gate)를 다른 프로젝트에 재사용 가능한 형태로 설치/주입한다."
---

# Portable Orchestrator

## 목적
- 현재 프로젝트의 오케스트레이션 체계를 다른 레포로 이식한다.
- 설치 후 대상 레포에서 바로 `orch:run`, `orchestration-gate`를 사용할 수 있게 만든다.

## 사용 조건
- 사용자가 "다른 프로젝트에도 같은 자동화 붙여줘", "portable로 뽑아줘", "템플릿 주입해줘" 같은 요청을 했을 때 실행한다.

## 실행 절차
1. 설치 스크립트 실행
- `node tools/orchestrator/portable/install.mjs --target <대상레포절대경로>`

2. 설정 파일 생성/주입 확인
- 대상 레포에 `orchestration.config.yaml`이 생성된다.
- 기본값을 프로젝트에 맞게 수정한다.

3. 대상 레포 package script 점검
- `orch:run`, `orch:checks`, `orch:report`, `agent-runtime:start` 추가 여부 확인

4. CI 연결 점검
- 대상 레포의 `.github/workflows/orchestration-gate.yml` 존재 확인
- 브랜치 보호 규칙에서 `orchestration-gate / gate` required check 설정 확인

## 산출물
- `ops/workflow/*`
- `tools/orchestrator/*`
- `tools/agent-runtime/server.ts`
- `.github/workflows/orchestration-gate.yml`
- `orchestration.config.yaml`

## 주의
- `_workspace/` 산출물 파일은 이식 대상에 커밋하지 않는다.
- 대상 레포의 기존 워크플로우/스크립트와 충돌 시 `--force` 없이 먼저 diff를 검토한다.
