# Backend 에이전트 규칙

## 목적
`backend/` 아래 작업에서만 필요한 API와 서비스 규칙을 모은다.

## 문서 유형
폴더 맥락 문서입니다. 백엔드 작업용 공통 규칙만 둡니다.

## 읽는 순서
1. 루트 `agent.md`
2. `docs/context/architecture.md`
3. `docs/context/module-structure.md`
4. `docs/conventions/02-FOLDER-SPLIT-RULES.md`
5. `docs/conventions/03-FILE-SPLIT-RULES.md`
6. `backend/docs/README.md`

## 역할
- HTTP API, 서비스 레이어, DB 접근, AI 오케스트레이션에 적용한다.
- 브라우저 UI와 프론트 렌더링은 이 문서의 범위 밖이다.
- 백엔드 전용 상세 문서는 `backend/docs/`를 먼저 확인한다.

## 책임 구획
- `routes/ai-*.ts` - AI 오케스트레이션, provider 선택, RAG, 추천, 인사이트
- `routes/auth.ts` - 인증과 권한 진입점
- `routes/courses.ts`, `routes/custom-courses.ts`, `routes/lectures.ts` - 학습 콘텐츠 흐름
- `routes/enrollments.ts`, `routes/dashboard.ts` - 사용자/대시보드 상호작용
- `routes/media.ts`, `routes/shortform.ts`, `routes/smart.ts` - 미디어와 생성 흐름
- `routes/health.ts`, `routes/index.ts` - 진입점과 상태 확인
- `lib/ai-*.ts`, `lib/stt-*.ts` - provider 연결과 어댑터
- `lib/auth.ts`, `lib/http.ts` - 공통 실행과 인증 보조
- API별 문서를 늘리기보다 이 책임 구획 단위로 문서를 분리한다.

## 특화 규칙
- API는 조정만 하고 실제 처리는 서비스가 담당한다.
- DB 접근과 비즈니스 로직은 분리한다.
- AI, RAG, STT, 인텐트, 숏폼 생성은 각각 독립 책임으로 나눈다.
- 공유 타입과 DTO는 `packages/shared/`를 우선한다.
- 테스트가 필요하면 `docs/conventions/15-BACKEND-TEST-CONVENTIONS.md`를 확인한다.
- DB 변경이 있으면 `docs/conventions/18-DATABASE-CONVENTIONS.md`를 확인한다.

## 실패 모드
- API 라우트에 비즈니스 로직이 쌓이는 상태
- DB 접근이 여기저기 흩어지는 상태
- AI 오케스트레이션이 서비스 책임과 섞이는 상태
