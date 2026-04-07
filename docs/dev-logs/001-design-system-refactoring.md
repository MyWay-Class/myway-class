# 2026-04-08 디자인 시스템 및 UI 구조 개선

## 변경 이유
- 대시보드 화면의 반복 UI를 줄이고 Tailwind 기반 스타일 체계를 정리하기 위해
- 공통 버튼, 카드, 뼈대 로딩을 재사용 가능하게 만들기 위해
- Tailwind를 사용하면서도 화면 책임을 과하게 섞지 않는 구조를 찾기 위해

## 비교한 안

### A안
- `frontend/src/components/ui/*`와 `frontend/src/components/domain/*`로 공통 UI와 도메인 UI를 분리
- Tailwind 유틸리티를 컴포넌트 내부에서 직접 사용
- `styles.css`는 공통 레이아웃과 카드 패턴만 유지

### B안
- 기존 패널 중심 구조를 유지
- Tailwind 설정만 추가하고 패널 안에서 바로 스타일을 관리
- 구조 변화는 적지만 반복 UI를 분리하는 효과가 약함

## 선택 이유
- A안이 `Button`, `Card`, `Badge`, `Skeleton`을 한 번만 정의하고 여러 패널에서 재사용할 수 있어 유지보수성이 더 좋았다.
- `CatalogPanel`, `IdentityPanel`, `CourseResourcesPanel`, `LecturePanel`의 책임을 줄여 화면이 더 읽기 쉬웠다.
- Tailwind를 쓰더라도 컴포넌트 경계를 유지하는 편이 이후 기능 추가에 유리했다.

## 검증
- A안과 B안 모두 TypeScript 타입체크는 통과했다.
- Vite build는 현재 환경에서 `spawn EPERM`으로 막혀 로컬 빌드 확인은 제한적이었다.
- 대신 `git diff --check`로 충돌성/공백 문제는 확인했다.

## 참고
- 이 로그는 A/B 비교 결과를 남기기 위한 기록이다.
- 최종 구현은 A안을 기준으로 진행한다.
