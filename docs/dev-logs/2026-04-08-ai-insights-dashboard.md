# AI 인사이트 대시보드

## 변경 이유
- AI 사용량과 역할별 통계를 한 화면과 한 API에서 확인할 수 있게 정리했다.
- 학생, 강사, 운영자마다 필요한 지표가 달라서 role-based payload를 분리했다.

## 변경 내용
- `GET /api/v1/ai/insights`를 추가했다.
- `packages/shared/src/ai-insights.ts`에서 요약, 기능 통계, 인텐트 통계를 계산한다.
- 대시보드에 AI 인사이트 패널을 추가했다.
- `docs/project/18-ai-insights-dashboard.md`와 API 계약 문서를 갱신했다.

## 검증
- 문서와 구현 경로를 일치시켰다.
- 워킹트리 A안은 별도 인사이트 라우트로 분리했다.
