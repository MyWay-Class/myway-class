# 모듈 구조

## 목적
기능을 어디에 둘지 정해서 구현이 섞이지 않게 한다.

## 책임 분리
- `frontend/`: 화면, 라우팅, UI 상태, API 호출
- `backend/`: 서비스, API, DB 접근, AI 오케스트레이션
- `packages/shared/`: 타입, DTO, 공통 enum, 공통 응답

## 기본 규칙
- 라우트는 조정만 하고, 실제 처리는 서비스가 한다.
- UI는 저장소 내부 구조를 알지 못한다.
- 공통 타입은 한 곳에서만 정의한다.

## 권장 배치
- `frontend/src/components`
- `frontend/src/pages`
- `frontend/src/lib`
- `backend/src/routes`
- `backend/src/services`
- `backend/src/middleware`
- `packages/shared/src`

