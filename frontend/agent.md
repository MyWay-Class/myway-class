# Frontend 에이전트 규칙

## 목적
`frontend/` 아래 작업에서만 필요한 UI와 라우팅 규칙을 모은다.

## 문서 유형
폴더 맥락 문서입니다. 프론트 작업용 공통 규칙만 둡니다.

## 읽는 순서
1. 루트 `agent.md`
2. `docs/context/module-structure.md`
3. `docs/conventions/02-FOLDER-SPLIT-RULES.md`
4. `docs/conventions/03-FILE-SPLIT-RULES.md`
5. `frontend/docs/README.md`

## 역할
- 브라우저 UI, 라우팅, 화면 상태, 사용자 입력 처리에만 적용한다.
- 서버 로직, DB 접근, AI 오케스트레이션은 이 문서의 범위 밖이다.
- 프론트 전용 상세 문서는 `frontend/docs/`를 먼저 확인한다.

## 책임 구획
- `src/features/lms/pages/` - 사용자 화면과 기능별 페이지
- `src/features/lms/components/` - 기능 내부 전용 조립 컴포넌트
- `src/components/` - 공용 화면 조각
- `src/lib/` - API 호출, 상태, 포맷, 흐름 보조
- `src/features/lms/*` 아래는 페이지 중심으로 나누고, API별 문서는 만들지 않는다.

## 특화 규칙
- UI 상태와 서버 상태를 섞지 않는다.
- 공유 계약은 `packages/shared/`를 우선한다.
- 프론트 컴포넌트는 프론트 책임만 가진다.
- 새 화면이나 폴더를 나눌 때는 폴더 분리와 파일 분리 규칙을 따른다.
- 테스트가 필요하면 `docs/conventions/16-FRONTEND-TEST-CONVENTIONS.md`를 확인한다.

## 실패 모드
- 프론트에 서버 책임이 스며드는 상태
- 화면 상태와 공유 계약이 뒤섞이는 상태
- 라우팅과 UI 로직이 과도하게 커지는 상태
