# 2026-04-13 duration / playback alignment

## 변경 이유
- 강의 상세, 시청, 스크립트, 숏폼에서 서로 다른 길이 기준을 쓰고 있었다.
- 상대 경로 영상 URL이 Pages 오리진으로 붙어 재생이 실패하는 문제가 있었다.
- 전사 결과가 있어도 lecture duration 이 메타데이터에 반영되지 않아 상세 화면과 실제 영상이 어긋났다.

## 변경 내용
- `frontend/src/lib/video-url.ts`에 재생 URL 해석 헬퍼를 추가했다.
- 강의 상세, 시청, 숏폼 미리보기에서 실제 재생 URL을 API base 기준으로 해석하도록 바꿨다.
- `backend/src/lib/learning-store.ts`에 전사/추출 길이 백필 경로를 추가했다.
- 전사 생성과 오디오 추출 완료 시 lecture duration 을 실제 값으로 갱신하도록 연결했다.
- shared 레벨에서 transcript duration 이 있으면 강의 총 러닝타임 계산에 우선 사용하도록 맞췄다.
- AI1 강의 전사 원문을 shared demo media 와 D1 seed 에 함께 넣어, 강의 상세/시청/스크립트/숏폼이 같은 STT 결과를 보게 했다.
- lecture duration 백필은 transcript duration_ms 를 올림 처리해서 2분 21초 같은 짧은 강의도 3분으로 덜 왜곡되게 맞췄다.

## 검증
- `npm --workspace @myway/frontend run build`
- `npm --workspace @myway/backend run build`

## 선택 이유
- 표시만 바꾸는 방식보다, 저장된 길이와 재생 경로를 함께 정리하는 쪽이 이후 숏폼/스크립트/UI 전체에 일관되다.
