# 백엔드 설정

## 목적
백엔드가 어떤 기준으로 시작되고 유지되는지 정리한다.

## 기본 스택
- Hono
- TypeScript
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2

## 규칙
- 라우트는 입력 검증과 서비스 호출만 담당한다.
- 비즈니스 로직은 서비스에 둔다.
- 응답은 공통 봉투를 사용한다.
- AI 작업은 추적 가능해야 한다.

