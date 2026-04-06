# 모듈 구조

## 목적
기능 배치의 큰 기준만 빠르게 확인할 수 있게 한다.

## 역할
- 이 문서는 모듈 배치의 요약 허브다.
- 구현 기준의 상세 내용은 `docs/project/03-module-structure.md`를 따른다.
- 새 파일을 어디에 둘지 빠르게 판단할 때 쓴다.

## 한눈에 보기
- `frontend/`: 화면, 라우팅, UI 상태, API 호출
- `backend/`: 서비스, API, DB 접근, AI 오케스트레이션
- `packages/shared/`: 타입, DTO, 공통 enum, 공통 응답

## 핵심 규칙
- 라우트는 조정만 하고 실제 일은 서비스가 한다.
- UI 컴포넌트는 저장소 내부 구조를 알지 못한다.
- 공통 타입은 한 곳에서만 정의한다.
- 프롬프트 로직은 비즈니스 로직과 분리한다.

## 상세 문서
- 파일과 폴더 책임: `docs/project/03-module-structure.md`
- 공통 경계와 저장소 구조: `docs/project/POLY-REPO.md`
