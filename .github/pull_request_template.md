# 변경 요약
<!-- 변경 내용을 한두 문장으로 적어주세요. -->

## 배경
<!-- 왜 이 변경이 필요한지 적어주세요. -->

## 변경 내용
<!-- 무엇을 바꿨는지 적어주세요. -->

## 연결 이슈
- Closes #
- Fixes #

## 검증
- [ ] 로컬 확인 완료
- [ ] 실행한 명령과 결과를 본문에 적었다
- [ ] 실패가 있었다면 실패 링크/재현 명령을 본문에 적었다
- [ ] 문서 갱신 완료
- [ ] 영향 범위 점검 완료
- [ ] (설계 변경 시) ADR 상태 갱신 완료 (Proposed/Accepted/Superseded)
- [ ] AI/Media/STT/Shortform 변경이면 `npm run smoke:media-ai-shortform` 결과를 적었다

## 코드리뷰
- [ ] CODEOWNERS 자동 리뷰 요청이 걸린다
- [ ] 프론트 변경이면 `frontend/` 담당자 확인이 필요하다
- [ ] 백엔드 변경이면 `backend/` 담당자 확인이 필요하다
- [ ] 문서 변경이면 `docs/` 담당자 확인이 필요하다
- [ ] 공통 타입 변경이면 `packages/shared/` 담당자 확인이 필요하다
- [ ] 리뷰 시 확인해야 할 포인트를 적었다
- [ ] PR 본문에 연결 이슈 번호가 들어갔다

## 체크 사항
- [ ] 범위가 MoSCoW 기준에 맞는다
- [ ] 관련 문서가 함께 갱신됐다
- [ ] 기능 PR이면 ADR 링크를 본문에 포함했다 (없으면 PR 보류)
- [ ] `docs/dev-logs/`에 변경 요약을 남겼다
- [ ] 불필요한 리팩터링이 없다

## QA Gates (docs/architecture/qa-gates.md)
- [ ] 의존 방향 규칙 준수 (`api -> domain`, `api -> persistence` 직접 접근 없음)
- [ ] 신규 `Map<String,Object>` 경계 도입 없음
- [ ] DTO 경계 규칙 준수 (Entity 직접 API 반환 없음, Mapper 경유)
- [ ] 트랜잭션 규칙 준수 (`@Transactional`은 application 계층)
- [ ] 이벤트 메타/멱등 규칙 준수
- [ ] Query key 중앙화 및 invalidate 대상 명시
- [ ] 예외 규칙 사용 시 ADR 링크 첨부
- [ ] 계층별 테스트 갱신 완료 (application unit / persistence integration / api contract-e2e)

## 검증 로그 요약
- verify: <!-- 예: npm run verify 통과 -->
- layer tests: <!-- 예: npm run test:backend 통과 -->
- smoke: <!-- 예: npm run smoke:media-ai-shortform 통과 / 실패 링크 -->
- risk/rollback: <!-- 변경 리스크와 롤백 방법 -->

## ADR 링크
- ADR: `docs/decisions/ADR-xxxx-*.md`
- 상태 변경: `Proposed -> Accepted` 또는 `Accepted -> Superseded` (해당 시 기입)
