# 모노레포 구조

## 목적
MyWayClass 모노레포의 폴더 책임과 의존성 방향을 설명한다.

## 역할
이 문서는 저장소의 큰 배치를 보여주는 상세 기준이다.
세부 모듈 설명은 `03-module-structure.md`를 따른다.

## 구조
- `frontend/`: 브라우저 UI와 화면 상태
- `backend/`: API, 서비스, Workers, DB 접근, AI 오케스트레이션
- `packages/shared/`: 공통 타입, DTO, enum, API envelope
- `docs/`: 프로젝트 공통 문서
- `frontend/docs/`: 프론트 전용 문서
- `backend/docs/`: 백엔드 전용 문서

## 의존성 방향
- `frontend/`와 `backend/`는 `packages/shared/`를 참조할 수 있다.
- `packages/shared/`는 다른 앱 폴더를 참조하지 않는다.
- `docs/`는 코드에 의존하지 않고 설계 기준만 담는다.

## 검증 기준
- 새 파일을 만들 때 어디에 둘지 바로 판단할 수 있어야 한다.
- 공통 타입이 여러 곳에 중복 정의되지 않아야 한다.
