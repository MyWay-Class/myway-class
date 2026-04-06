## API 계약

## 목적
모든 공개 엔드포인트의 요청과 응답 규칙을 정의한다.

## 범위
- 인증
- 강의와 수업
- AI와 미디어
- 숏폼과 커뮤니티
- 스마트 어시스턴트

## 입력
- UI 요청
- AI 오케스트레이션 결과

## 출력
- 안정적인 JSON 계약
- 에러 의미 체계
- 엔드포인트 책임 분리

## 규칙
- 하나의 공통 응답 봉투를 사용한다.
- 작업을 시작하기 전에 필수 필드를 검증한다.
- 명확한 HTTP 상태 코드를 반환한다.
- 가능하면 AI 출력도 구조화된 JSON으로 유지한다.

## 공통 응답 형태
```ts
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
```

## 핵심 엔드포인트
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/me`
- `GET /api/v1/courses`
- `GET /api/v1/courses/:id`
- `POST /api/v1/lectures`
- `GET /api/v1/lectures/:id`
- `POST /api/v1/ai/qa`
- `POST /api/v1/ai/quiz/generate`
- `POST /api/v1/ai/search`
- `POST /api/v1/media/transcribe`
- `POST /api/v1/media/summarize`
- `POST /api/v1/media/extract-audio`
- `POST /api/v1/shortform/generate`
- `GET /api/v1/shortform/my`
- `POST /api/v1/smart/chat`

## 에러 정책
- `400` invalid input
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `500` unexpected server failure

## 예외 상황
- 데모 전용 엔드포인트는 문서와 UI에 반드시 표시한다.
- AI 엔드포인트도 실패 시 같은 응답 봉투를 반환해야 한다.

## 실패 모드
- 응답 봉투가 일관되지 않은 경우
- JSON 대신 원문 텍스트를 보내는 경우
- 보호된 엔드포인트에 인증이 빠진 경우

## 검증 기준
- 클라이언트가 payload 형태를 추측하지 않아도 된다.
- 모든 엔드포인트의 에러 계약이 예측 가능하다.
