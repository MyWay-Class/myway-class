# LMS Fallback Actions

## 개요
- 역할별 fallback 화면이 더 이상 막다른 길처럼 보이지 않도록, 다음 행동으로 이어지는 버튼을 추가했다.
- dead-end 버튼을 줄이고, 사용자가 바로 돌아갈 수 있는 진입점을 제공하는 것이 목적이다.

## 반영 내용
- `RolePageFallback`에 선택적 action 버튼을 추가했다.
- 관리자 fallback에는 `대시보드`, `내 강의` 이동을 넣었다.
- 교강사 fallback에는 `내 강의`, `강의 개설` 이동을 넣었다.
- 학생의 잠긴 `media-pipeline` fallback에는 `강의 상세`, `내 강의` 이동을 넣었다.
- 공통 fallback에는 `대시보드`, `내 숏폼 보기` 이동을 넣었다.

## 의도
- fallback은 기능 미구현을 알리는 동시에, 사용자가 즉시 다음 경로를 선택할 수 있어야 한다.
- 특히 LMS에서는 "준비 중" 문구만 보여주는 화면이 UX를 끊기 때문에, 최소한의 이동 버튼을 제공하는 편이 낫다.

## 검증
- `npm --workspace @myway/frontend run build` 통과
