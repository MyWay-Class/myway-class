# 2026-04-08 file split guidance

## 문서 유형
기록 문서입니다. 파일 분리 기준이 실제 구현과 맞게 충분히 명시돼 있는지 보강한 내역을 적습니다.

## 변경 내용
- `docs/conventions/03-FILE-SPLIT-RULES.md`에 200/300줄 기준과 강제 분리 조건을 추가했다.
- `docs/conventions/11-REACT-PROJECT-STRUCTURE.md`에 큰 화면은 섹션 컴포넌트로 나누라는 규칙을 넣었다.

## 검증
- 현재 구조를 기준으로 `App.tsx`, `packages/shared` 도메인 파일, dashboard 섹션 컴포넌트가 분리 기준 안에 들어오는지 확인했다.
