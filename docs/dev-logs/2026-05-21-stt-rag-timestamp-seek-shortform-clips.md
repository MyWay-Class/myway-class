# 2026-05-21 STT-RAG Timestamp Seek + Multi-Clip Shortform

## 요약
- AI search/answer 응답에 구조화된 타임스탬프 근거(`sources`)를 추가했다.
- 강의 시청 화면에서 transcript/챗봇 타임스탬프를 클릭하면 해당 시점으로 영상 seek 되도록 연결했다.
- 숏폼 compose API가 다중 클립(`lecture_id`, `start_ms`, `end_ms`)을 수용하고 export payload에 반영되도록 확장했다.
- Postgres 환경에서 AI 쿼터 조회 중 발생하던 activity_event 파라미터 타입 오류를 동적 SQL로 수정했다.

## 검증
- backend: `mvn -DskipTests package`
- backend: `mvn -Dtest=AiContractTest#aiSearchAndAnswer_shouldIncludeStructuredSources,ShortformComposeClipsIntegrationTest test`
- frontend: `npm test -- --run src/features/lms/components/chat-reference-time.test.ts src/lib/video-url.test.ts`

## 리스크
- media asset 재생 경로는 데모/로컬 운영 편의성을 위한 fallback이 포함되어 있어, 운영 보안 정책에 맞춘 추가 정리가 필요하다.
- 숏폼 clips는 payload/상태 저장까지 완료되었고, 실제 렌더링 dispatch 연계는 후속 작업이 필요하다.
