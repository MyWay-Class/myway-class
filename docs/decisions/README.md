# Architecture Decision Records (ADR)

## 목적
- 설계 변경 사항의 배경, 선택 근거, 트레이드오프, 검증/롤백 기준을 추적한다.
- 기능 구현 완료 기준에 문서 업데이트를 포함해 지식 누락을 방지한다.

## 상태 관리
- `Proposed`: 검토 중인 설계
- `Accepted`: 채택되어 구현/운영 기준으로 사용하는 설계
- `Superseded`: 더 최신 ADR로 대체된 설계

각 ADR 헤더에 다음 메타를 반드시 포함한다.
- `Status`
- `Date`
- `Owners`
- `Supersedes` (선택)
- `Superseded by` (선택)

## 필수 템플릿
`docs/decisions/ADR-TEMPLATE.md`를 기본으로 작성한다.

필수 섹션:
- 배경(Context)
- 목표(Decision Drivers)
- 고려한 대안(Options)
- 최종 선택(Decision)
- 선택 이유(Rationale)
- 포기한 대안의 이유(Why not)
- 결과/영향(Consequences)
- 검증 계획(How we will verify)
- 롤백 조건(Rollback Trigger)

## 운영 원칙
- 기능 PR에는 ADR 링크를 본문에 포함한다.
- "구현 완료" 조건에 "문서 업데이트 완료"를 포함한다.
- 설계 변경 시 ADR 상태를 `Proposed/Accepted/Superseded`로 갱신한다.
- 기존 설계를 대체하는 경우, 이전 ADR에 `Superseded by`를 명시한다.
