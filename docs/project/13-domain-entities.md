# 도메인 엔티티

## 목적
기본 LMS와 AI 레이어가 공유하는 데이터 모델과 상태를 정의한다.

## 선택 이유
- 프론트와 백엔드가 같은 이름의 데이터를 봐야 계약이 흔들리지 않는다.
- AI 산출물과 LMS 데이터가 섞이면 추적이 어려워지므로 엔티티를 먼저 고정해야 한다.
- 교육 도메인은 사용자, 강의, 수강, 진도, AI 결과가 서로 연결되어야 한다.

## 범위
- 사용자와 권한
- 강의와 수강
- 미디어와 트랜스크립트
- AI 산출물
- 커뮤니티 반응

## 입력
- 기본 LMS 흐름
- AI 처리 결과
- 사용자 행동 로그

## 출력
- 공통 엔티티 목록
- 상태값 정의
- API와 DB가 공유할 계약

## 규칙
- 엔티티 이름은 도메인 용어를 따른다.
- `packages/shared`에는 공통 계약만 둔다.
- DB 구현 세부와 문서용 의미를 섞지 않는다.
- 상태는 문자열 리터럴 합집합으로 표현한다.
- 원본 강의와 AI 산출물의 연결 키를 반드시 남긴다.
- 사용자 데이터와 운영 로그는 분리한다.

## 핵심 엔티티
- `AuthUser`
- `AuthSession`
- `LoginRequest`
- `LoginResponse`
- `User`
- `Role`
- `Course`
- `Lecture`
- `Enrollment`
- `Progress`
- `Material`
- `Notice`
- `Transcript`
- `Chunk`
- `Summary`
- `Shortform`
- `IntentLog`
- `Reaction`

## 상태 예시
- `EnrollmentStatus`
- `ProgressStatus`
- `TranscriptStatus`
- `PipelineStatus`
- `ShortformStatus`

## 기준값
- `AuthUser`, `AuthSession`, `LoginRequest`, `LoginResponse`는 인증과 권한에서 공통 사용한다.
- `User`와 `Role`은 LMS와 AI 전반에서 쓰는 상위 도메인 용어다.
- `Course`와 `Lecture`는 LMS 코어의 중심 엔티티다.
- `Transcript`, `Chunk`, `Summary`, `Shortform`, `IntentLog`는 AI 레이어의 추적 엔티티다.
- `Reaction`은 커뮤니티와 랭킹 계산에만 쓰고 학습 데이터와 섞지 않는다.

## 인증 상태
- 사용자는 `STUDENT`, `INSTRUCTOR`, `ADMIN` 역할 중 하나를 가진다.
- 인증 세션은 로그인과 로그아웃 흐름에서 생성과 삭제가 일어난다.

## 예외 상황
- AI 산출물은 원본 강의와 연결되지 않으면 저장하지 않는다.
- 운영 로그와 사용자 데이터는 분리한다.

## 실패 모드
- 같은 의미의 엔티티를 여러 이름으로 만드는 경우
- 상태값이 문서마다 달라지는 경우
- AI 산출물과 원본 강의 연결이 끊기는 경우

## 검증 기준
- 프론트와 백엔드가 같은 이름의 엔티티를 본다.
- 기본 LMS와 AI 레이어가 같은 공통 계약을 사용한다.
