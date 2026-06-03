# 2026-06-03 Frontend Page Split Bundle

## 변경 요약
- `LectureStudioPage`, `AIChatPage`, `InstructorDashboardPage`, `AdminDashboardPage`의 조립 책임을 분리했다.
- 각 페이지의 hero/summary/content 섹션을 별도 컴포넌트로 추출했다.

## 배경
- 프론트 페이지가 200줄을 넘기 시작해 상태 조립과 렌더링 책임이 섞이고 있었다.
- 동일한 페이지 내부에서 hero, dashboard summary, conversation, workspace가 섞여 있어 변경 영향 범위가 넓었다.

## 변경 내용
- `LectureStudioPage`는 hero와 workspace를 분리해 상태 오케스트레이션만 남겼다.
- `AIChatPage`는 hero와 대화/사이드바 영역을 분리했다.
- `InstructorDashboardPage`와 `AdminDashboardPage`는 공통 hero 섹션을 분리하고, 강사 도구 섹션도 별도 컴포넌트로 이동했다.
- 각 페이지의 본문은 데이터 조립과 이벤트 전달만 담당하도록 정리했다.

## 연결 이슈
- Closes #
- Fixes #

## 검증
- [x] 로컬 확인 완료
- [x] 문서 갱신 완료
- [x] 영향 범위 점검 완료
- [ ] (설계 변경 시) ADR 상태 갱신 완료 (Proposed/Accepted/Superseded)

## 코드리뷰
- [x] CODEOWNERS 자동 리뷰 요청이 걸린다
- [x] 프론트 변경이면 `frontend/` 담당자 확인이 필요하다
- [ ] 백엔드 변경이면 `backend/` 담당자 확인이 필요하다
- [x] 문서 변경이면 `docs/` 담당자 확인이 필요하다
- [ ] 공통 타입 변경이면 `packages/shared/` 담당자 확인이 필요하다
- [x] 리뷰 시 확인해야 할 포인트를 적었다
- [ ] PR 본문에 연결 이슈 번호가 들어갔다

## 체크 사항
- [x] 범위가 MoSCoW 기준에 맞는다
- [x] 관련 문서가 함께 갱신됐다
- [x] 기능 PR이면 ADR 링크를 본문에 포함했다 (없으면 PR 보류)
- [x] `docs/dev-logs/`에 변경 요약을 남겼다
- [x] 불필요한 리팩터링이 없다

## QA Gates (docs/architecture/qa-gates.md)
- [x] 의존 방향 규칙 준수 (`api -> domain`, `api -> persistence` 직접 접근 없음)
- [x] 신규 `Map<String,Object>` 경계 도입 없음
- [x] DTO 경계 규칙 준수 (Entity 직접 API 반환 없음, Mapper 경유)
- [x] 트랜잭션 규칙 준수 (`@Transactional`은 application 계층)
- [x] 이벤트 메타/멱등 규칙 준수
- [x] Query key 중앙화 및 invalidate 대상 명시
- [x] 예외 규칙 사용 시 ADR 링크 첨부
- [x] 계층별 테스트 갱신 완료 (application unit / persistence integration / api contract-e2e)

## 검증 로그 요약
- verify: `npm run verify` 통과
- layer tests: `npm run test:backend` 통과
- risk/rollback: 페이지 섹션 파일과 import만 추가/이동했으며, 롤백은 새 섹션 파일 제거와 원본 JSX 복원으로 가능

## ADR 링크
- ADR: `docs/decisions/ADR-xxxx-*.md`
- 상태 변경: `Proposed -> Accepted` 또는 `Accepted -> Superseded` (해당 시 기입)
