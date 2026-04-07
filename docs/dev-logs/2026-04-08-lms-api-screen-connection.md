# LMS API와 화면 연결

## 변경 내용
- 백엔드 `/api/v1/health`를 프론트에서 확인하고 화면에 표시했다.
- 학습 상태 갱신 로직을 `frontend/src/lib/app-state.ts`로 분리했다.
- 자료/공지/진도 흐름은 공통 deps를 통해 연결했다.

## 검증
- `npm run build` 통과

## 메모
- 화면이 실제 API에 연결되어 있는지 한눈에 볼 수 있게 했다.
- `App.tsx`는 200줄 이하로 유지했다.
