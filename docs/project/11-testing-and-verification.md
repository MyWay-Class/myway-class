# 검증과 확인

## 목적
설계가 실제 구현 단계로 넘어갈 준비가 되었는지 확인하는 방법을 정의한다.

## 범위
- 문서 일관성
- 기능 시나리오
- 데모 준비도
- AI 실행 준비도

## 입력
- 모든 설계 문서
- 구현 코드

## 출력
- 검증 체크리스트
- 실패 사례
- PR 검증 증적

## 규칙
- 모든 기능에는 명확한 책임 주체가 있어야 한다.
- 상태 이름은 문서 전체에서 일치해야 한다.
- 데모 전용 동작은 반드시 명시해야 한다.

## 시나리오
- 로그인 흐름
- 강의 요약과 타임스탬프
- RAG 질의응답
- 숏폼 생성
- 커뮤니티 반응
- AI fallback 동작

## 예외 상황
- 문서에만 존재하는 기능
- 코드에만 존재하는 기능

## 실패 모드
- 용어 충돌
- 책임 주체 누락
- 완료 기준 부재

## 검증 기준
- AI 에이전트가 숨은 질문 없이 문서만으로 구현할 수 있다.
- 데모 흐름이 끝까지 추적 가능하다.

## 실행 명령
- `npm run check:deps`
- `npm run verify`
- `npm run build`
- `npm run smoke:media-ai-shortform` (영상/STT-RAG/숏폼 callback API 스모크)

## PR 증적 규칙
- PR 본문에는 실제 실행한 명령을 적는다.
- 각 명령의 결과는 `통과/실패`로 남기고, 실패가 있으면 재현 링크 또는 로그 경로를 적는다.
- AI/Media/STT/Shortform 변경은 `npm run smoke:media-ai-shortform` 결과를 별도 항목으로 남긴다.
- 최소 기준은 `npm run verify`이며, 계약이 중요한 변경은 `npm run test:backend` 또는 관련 레이어 테스트를 추가한다.
- CI에서 실패가 나면 가능한 한 동일 명령으로 로컬 재현을 먼저 시도한다.

## 스모크 실행 변수
- `SMOKE_BASE_URL`: 대상 backend URL (`http://127.0.0.1:8787` 기본)
- `SMOKE_SHORTFORM_CALLBACK_TOKEN`: shortform callback secret (`dev-shortform-callback-token` 기본)
- `SMOKE_STUDENT_USER_ID`, `SMOKE_ADMIN_USER_ID`: 로그인 사용자 ID
- `SMOKE_LECTURE_ID`, `SMOKE_COURSE_ID`: 스모크 대상 강의/코스 ID

## GitHub 수동 실행
- workflow: `.github/workflows/smoke-media-ai-shortform.yml`
- 입력: `base_url` 필수, 나머지 ID는 선택
- secret: `SMOKE_SHORTFORM_CALLBACK_TOKEN` 필수
- timeout/concurrency: manual/schedule 실행은 중복 실행 방지를 위해 workflow concurrency를 유지하는 쪽이 안전하다.

## GitHub 스케줄 실행
- workflow: `.github/workflows/smoke-media-ai-shortform.yml` (`schedule` 포함)
- 기본 주기: 하루 1회 (UTC `02:17`, KST `11:17`)
- 필수 Repository Variable: `SMOKE_BASE_URL`
- 선택 Repository Variables: `SMOKE_LECTURE_ID`, `SMOKE_COURSE_ID`, `SMOKE_STUDENT_USER_ID`, `SMOKE_ADMIN_USER_ID`
- 필수 Secret: `SMOKE_SHORTFORM_CALLBACK_TOKEN`
- 검증 대상: 영상 업로드, STT callback, RAG timestamp, 숏폼 export, playback smoke
