# 2026-04-13 AI 강의 사전 시드 및 dev 메모리 동기화

## 변경 내용
- 초기에는 `crs_ai_seed_001` 강의를 D1에 직접 추가했다.
- 이후 현재 기준 강의는 `crs_ai_001`으로 정리했고, `lec_ai_001`, `lec_ai_002`, `lec_ai_003` 차시에 `ai1강.mp4`, `ai2강.mp4`, `ai3강.mp4`를 연결했다.
- `course_materials`, `course_notices`, `enrollments`도 함께 넣어 강의 상세와 내 강의 흐름이 보이도록 했다.
- `backend/src/lib/learning-store.ts`에 dev 메모리 재동기화 경로를 추가했다.
- `backend/src/routes/dev.ts`를 추가해 dev에서만 학습 저장소를 다시 읽는 엔드포인트를 만들었다.

## 결과
- dev backend에서 새 강의가 강의 목록과 상세 페이지에 노출된다.
- 강의 상세에서 각 차시의 `video_url`이 실제 R2 객체를 가리킨다.
- 원본 mp4는 `Documents`에 유지하고, 작업 폴더의 임시 압축본만 정리했다.
