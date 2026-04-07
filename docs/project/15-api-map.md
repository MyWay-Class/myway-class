# API 맵

## 목적
기본 LMS API와 AI API가 어떤 역할로 나뉘는지 한눈에 보이게 정리한다.

## 선택 이유
- API를 먼저 나누면 프론트가 어떤 기능을 호출해야 하는지 분명해진다.
- 기본 LMS와 AI API를 나누면 AI를 끄거나 교체해도 핵심 LMS는 유지된다.
- 교육 도메인은 기능이 많아 보여도, 실제로는 강의/수강/AI/숏폼/커뮤니티로 나누면 관리가 쉬워진다.

## 범위
- 인증 API
- 강의 API
- 수강 API
- 자료 API
- AI API
- 숏폼 API
- 커스텀 강의 API
- 커뮤니티 API

## 입력
- 사용자 요청
- 프론트 화면 액션
- AI 레이어 결과

## 출력
- 기능별 API 경로
- 책임 분리
- 요청과 응답의 연결 구조

## 규칙
- 기본 LMS API와 AI API는 분리한다.
- 라우트는 얇게 유지하고 실제 처리는 서비스가 한다.
- 공통 응답 봉투를 사용한다.
- 에러 계약은 API 전반에서 일관되게 유지한다.
- 데모용 엔드포인트는 운영 API와 네이밍으로 구분한다.

## API 묶음
- 인증
  - 로그인, 로그아웃, 내 정보
- 강의
  - 목록, 상세, 등록, 수정
- 수강
  - 신청, 해제, 진도 저장
- 자료
  - 업로드, 조회, 삭제
- AI
  - 요약, 챗봇, 검색, 퀴즈, 인텐트, 통합 채팅
- 숏폼
  - 생성, 후보 선택, 조립, 공개, 내 목록, 커뮤니티
- 커스텀 강의
  - 클립 선택, 조립, 저장, 담아가기
- 커뮤니티
  - 반응, 랭킹, 신고

## 현재 구현 라우트
- `GET /api/v1/auth/users`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /`
  - 백엔드 준비 상태
- `GET /api/v1/health`
  - 서비스 상태 확인
- `GET /api/v1/dashboard`
  - 학습자 대시보드
- `GET /api/v1/courses`
  - 수강 가능한 코스 목록
- `GET /api/v1/courses/:courseId`
  - 코스 상세와 강의 목록
- `GET /api/v1/courses/:courseId/lectures`
  - 코스의 강의 목록만 조회
- `GET /api/v1/courses/:courseId/materials`
  - 코스의 자료 목록 조회
- `POST /api/v1/courses/:courseId/materials`
  - 코스 자료 등록
- `GET /api/v1/courses/:courseId/notices`
  - 코스의 공지 목록 조회
- `POST /api/v1/courses/:courseId/notices`
  - 코스 공지 등록
- `GET /api/v1/lectures/:lectureId`
  - 강의 상세
- `POST /api/v1/lectures/:lectureId/complete`
  - 강의 완료와 진도 저장
- `POST /api/v1/media/transcribe`
  - 트랜스크립트 생성
- `POST /api/v1/media/summarize`
  - 요약 노트 생성
- `POST /api/v1/media/extract-audio`
  - 오디오 추출 메타데이터 생성
- `GET /api/v1/media/transcript/:lectureId`
  - 강의 트랜스크립트 조회
- `GET /api/v1/media/notes/:lectureId`
  - 강의 요약 노트 조회
- `GET /api/v1/media/audio-extractions/:lectureId`
  - 강의 오디오 추출 기록 조회
- `GET /api/v1/media/pipeline/:lectureId`
  - 강의 미디어 파이프라인 상태 조회
- `POST /api/v1/shortform/generate`
  - 숏폼 후보 생성
- `PUT /api/v1/shortform/candidates/select`
  - 숏폼 후보 선택 반영
- `GET /api/v1/shortform/extraction/:id`
  - 숏폼 추출 결과 조회
- `POST /api/v1/shortform/compose`
  - 숏폼 조립
- `GET /api/v1/shortform/videos/my`
  - 내 숏폼 목록
- `GET /api/v1/shortform/video/:id`
  - 숏폼 상세
- `POST /api/v1/shortform/share`
  - 숏폼 공유
- `GET /api/v1/shortform/community`
  - 숏폼 커뮤니티 피드
- `POST /api/v1/shortform/save`
  - 숏폼 담아가기
- `POST /api/v1/shortform/like`
  - 숏폼 좋아요
- `GET /api/v1/shortform/library`
  - 내 숏폼 라이브러리
- `POST /api/v1/custom-courses/compose`
  - 커스텀 강의 생성
- `GET /api/v1/custom-courses/my`
  - 내 커스텀 강의 목록
- `GET /api/v1/custom-courses/community`
  - 같은 강의 수강생 공유 목록
- `GET /api/v1/custom-courses/:customCourseId`
  - 커스텀 강의 상세
- `POST /api/v1/custom-courses/:customCourseId/share`
  - 커스텀 강의 공유
- `POST /api/v1/custom-courses/:customCourseId/copy`
  - 커스텀 강의 담아가기
- `POST /api/v1/ai/intent`
  - 사용자 메시지 의도 분류
- `POST /api/v1/ai/search`
  - 강의 근거 검색
- `POST /api/v1/ai/answer`
  - 질문 응답과 근거 참조 생성
- `POST /api/v1/ai/summary`
  - 강의 요약 생성
- `POST /api/v1/ai/quiz`
  - 강의 기반 퀴즈 생성
- `GET /api/v1/ai/insights`
  - AI 사용량과 역할별 인사이트
- `POST /api/v1/smart/chat`
  - 스마트 AI 통합 채팅
- `GET /api/v1/enrollments`
  - 내 수강 목록
- `POST /api/v1/enrollments`
  - 수강 신청

## 기준값
- LMS 코어 API는 강의와 수강의 기본 흐름만 담당한다.
- 인증 API는 로그인, 로그아웃, 내 정보만 담당한다.
- 역할 기반 접근 제어는 세션 사용자 역할로 처리한다.
- 자료와 공지는 코스 상세와 같은 도메인 안에서 관리한다.
- AI API는 요약, 챗봇, 검색, 퀴즈, 인텐트 같은 증강 기능만 담당한다.
- 커스텀 강의 API는 같은 강의 수강자만 공유와 담아가기가 가능해야 한다.
- 프론트는 공통 응답 봉투만 알면 되도록 계약을 단순화한다.
- API 경로는 도메인 단위로 읽히도록 구성한다.
- 현재 구현은 데모 데이터 기반이지만 응답 봉투와 경로 구조는 실제 계약과 동일하다.

## 예외 상황
- 데모 전용 API는 운영 API와 분리한다.
- AI 실패 응답도 같은 봉투를 유지한다.

## 실패 모드
- API 이름은 있는데 실제 책임이 없는 경우
- 기본 LMS와 AI API가 서로 섞이는 경우
- 프론트와 백엔드가 다른 계약을 보는 경우

## 검증 기준
- API만 봐도 기본 LMS와 AI 레이어가 나뉘어 보인다.
- 프론트가 어떤 기능을 호출해야 하는지 바로 알 수 있다.
