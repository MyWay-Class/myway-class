# Shared Domain Split and Utility Cleanup

## 배경
- `packages/shared/src` 아래에 AI, RAG, LMS 관련 로직이 계속 누적되면서 파일 책임이 섞이고 있었다.
- 특히 `media`, `learning`, `custom-course`, `shortform` 영역은 한 파일에 너무 많은 로직이 몰려 있어 유지보수가 어려웠다.
- 정적 분석 경고(`let` export, 중첩 삼항, 체인된 `sort`, `replace()`)도 함께 정리할 필요가 있었다.

## 변경 내용
- `packages/shared/src/data`의 데모 데이터와 로그를 도메인별 파일로 정리했다.
- `packages/shared/src/ai`의 intent, smart, insights, recommendations, learning 로직을 helper/pipeline 단위로 나눴다.
- `packages/shared/src/rag`의 청킹, 엔티티, 파이프라인 로직을 유지하면서 정리 규칙을 맞췄다.
- `packages/shared/src/lms/media`, `learning`, `custom-course`, `shortform`를 각각 폴더 단위로 분리했다.
- `shortform`은 compose, sharing, interactions, helpers로 더 잘게 나누고, `media`는 text, collection, transcript, summary, audio, pipeline으로 나눴다.

## 검증 포인트
- frontend 타입체크와 backend 빌드가 통과했다.
- 각 도메인 폴더는 얇은 barrel 파일만 남기고 실제 로직은 역할별 파일에 들어갔다.
- 긴 파일이 줄어들고, 책임 단위가 분명해졌다.
