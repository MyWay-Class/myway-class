# 무료 티어 문서 secret/D1 정비

## 배경
- 무료 티어 공개 테스트 정책이 이미 코드에 들어갔지만, 배포 문서에는 secret 전환과 D1 바인딩 절차가 더 분명하게 남아 있어야 했다.

## 변경 내용
- `docs/project/19-deployment.md`에 `MYWAY_GEMINI_API_KEY`, `MYWAY_MEDIA_PROCESSOR_TOKEN`, `MYWAY_MEDIA_CALLBACK_SECRET`를 secret으로 넣는 절차를 추가했다.
- D1 quota 저장소 생성과 `DB` 바인딩 순서를 명확히 했다.
- `docs/project/21-free-tier-public-test-policy.md`에 공개 테스트 모드의 배포 전제와 secret/D1 기준을 추가했다.

## 검증
- 문서에서 secret 전환과 D1 바인딩 순서가 바로 읽히는지 확인했다.
