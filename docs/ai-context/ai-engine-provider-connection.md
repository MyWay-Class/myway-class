# AI Engine Provider Connection Guide

## 목적
실제 AI provider 엔진을 붙일 때, 어떤 파일만 바꾸면 되는지 한눈에 보이게 정리한다.

## 적용 범위
- backend 내부 provider 클라이언트
- backend 엔진 오케스트레이션
- route 비동기 연결
- 문서와 dev-log 반영

## 기본 원칙
- provider 카탈로그와 실제 호출 코드는 분리한다.
- route는 얇게 유지하고, 실제 호출은 `backend/src/lib/` 아래에서 처리한다.
- 처음 연결한 provider가 실패하면 기존 shared fallback으로 되돌아간다.
- 실제 엔진 연결은 한 기능부터 시작한다. `summary` 또는 `quiz` 같은 JSON 결과형이 가장 안전하다.

## 추천 파일 구조
- `backend/src/lib/providers/<provider>.ts`
  - 실제 HTTP 호출 또는 SDK 호출만 둔다.
- `backend/src/lib/ai-engine.ts`
  - provider 선택 후 prompt 생성, JSON 파싱, fallback 처리만 둔다.
- `backend/src/lib/ai-adapter.ts`
  - feature별 실행 진입점만 제공한다.
- `backend/src/routes/ai.ts`
  - 요청 검증과 응답 반환만 담당한다.

## 실제 연결 순서
1. 먼저 하나의 provider만 고른다.
2. provider별 호출 함수를 만든다.
3. 엔진 wrapper에서 prompt와 응답 파싱 규칙을 정한다.
4. fallback을 shared 구현으로 연결한다.
5. route를 async로 바꿔 엔진 wrapper를 호출한다.
6. 실패 시 기존 응답 형태가 유지되는지 확인한다.

## provider 클라이언트 체크리스트
- base URL과 모델 이름은 env로 받는다.
- timeout과 실패 시 null 반환 규칙을 정한다.
- 응답은 가능한 한 JSON only 프롬프트로 유도한다.
- 응답 파싱 실패 시 fallback으로 돌린다.
- provider가 없으면 demo 경로를 유지한다.

## 엔진 wrapper 체크리스트
- 입력은 shared request 타입을 그대로 쓴다.
- lecture가 없으면 바로 null 또는 fallback을 반환한다.
- source text는 transcript, note, lecture content 순으로 고른다.
- prompt는 짧고 명시적으로 쓴다.
- JSON 파싱 실패 시 shared 로직으로 되돌린다.
- 결과에 필요한 필드만 덮어쓴다.

## 우선 적용하기 좋은 순서
1. `summary`
2. `quiz`
3. `answer`
4. `search`
5. `smart`
6. `intent`

## 검증 기준
- backend build가 통과한다.
- 실제 provider가 죽어도 기존 기능이 살아 있다.
- API 응답 shape가 바뀌지 않는다.
- provider와 fallback 기준이 `docs/project/14-ai-layer.md`와 일치한다.

## 변경 시 함께 고칠 문서
- `docs/project/14-ai-layer.md`
- `docs/project/15-api-map.md`
- `docs/dev-logs/`
