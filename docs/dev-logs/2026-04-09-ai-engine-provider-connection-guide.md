# AI Engine Provider Connection Guide

## 배경
- 실제 AI 엔진 연결을 나중에 다시 할 때, 어느 파일만 건드리면 되는지 빠르게 찾을 수 있어야 했다.
- 구현 코드와 문서를 분리한 뒤에도 연결 절차가 사라지지 않도록, 짧은 가이드를 남겼다.

## 변경 내용
- `docs/ai-context/ai-engine-provider-connection.md`를 추가해 provider 클라이언트, engine wrapper, route 연결 순서를 정리했다.
- `docs/ai-context/agent.md`에 새 가이드의 읽는 순서를 추가했다.

## 검증 포인트
- 새로 들어오는 AI 연결 작업은 이 문서만 보고도 backend 변경 지점을 찾을 수 있다.
- `summary`와 `quiz` 같은 JSON 결과형부터 붙이면 안전하다.
