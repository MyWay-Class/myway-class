# 2026-06-03 Frontend Api Action Split Bundle

## 변경 요약
- `api-media`, `api-courses`, `api-shortforms`를 read/write/admin 하위 모듈로 분리했다.
- `useMediaPipelineActions`는 upload/review helper를 조립하는 얇은 오케스트레이터로 축소했다.

## 배경
- 프론트 API 래퍼가 점점 커지면서 읽기/쓰기/관리 동작이 한 파일에 섞이고 있었다.
- 미디어 파이프라인 액션은 업로드, 재추출, 승인, 화자 검수, 숏폼 재시도까지 한 파일에 들어 있어 변경 범위가 넓었다.

## 변경 내용
- `api-media`는 upload / transcript / admin으로 나눴다.
- `api-courses`는 read / write로 나눴다.
- `api-shortforms`는 read / write / admin으로 나눴다.
- `useMediaPipelineActions`는 upload/review helper 조립만 담당하도록 정리했다.

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
- risk/rollback: API barrel은 유지하고 내부 모듈만 분리했으며, 롤백은 barrel을 원래 단일 파일로 되돌리면 가능

## ADR 링크
- ADR: `docs/decisions/ADR-xxxx-*.md`
- 상태 변경: `Proposed -> Accepted` 또는 `Accepted -> Superseded` (해당 시 기입)
