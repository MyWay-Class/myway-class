# Cloudflare Deployment Infra

## 배경
- 이슈 #45는 Cloudflare Pages와 Workers 배포 경로, D1/R2 바인딩, 환경 분리를 실제 운영 기준으로 맞추는 작업이다.
- 배포 문서와 런타임 설정이 따로 놀지 않도록, A/B 워킹트리로 구현 방식을 비교했다.

## 비교
- A안은 `backend/src/lib/runtime-env.ts`로 얇게 env를 전달하고, `docs/project/19-deployment.md`에서 Pages/Workers와 환경 분리를 프로젝트 문서로 바로 읽을 수 있게 했다.
- B안은 `backend/src/lib/runtime-config.ts`로 env를 한 번 정규화한 뒤 backend 문서에 배포 가이드를 두는 방식이었다.

## 선택
- A안을 선택했다.
- 이유는 변경 범위가 더 작고, 이슈가 요구한 Pages/Workers 배포 흐름을 프로젝트 문서에서 바로 확인할 수 있으며, 추가 추상화 없이 `c.env`에서 provider까지 이어지는 경로를 유지하기 쉽기 때문이다.

## 검증
- A안과 B안 모두 `npm run build:backend`를 통과했다.
- A안은 `docs/project/00-index.md`와 `docs/project/19-deployment.md`로 배포 경로와 환경 분리를 함께 남겼다.
