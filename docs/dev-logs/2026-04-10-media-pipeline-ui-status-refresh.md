# 미디어 파이프라인 UI 상태 갱신 보강

## 왜 바꿨는가
- 최신 `dev` 기준으로 업로드, 외부 media processor dispatch, callback, STT 연결까지는 붙어 있었지만 화면에서는 중간 상태가 거칠게만 보였다.
- callback 이후 상태를 사용자가 다시 열어 보지 않으면 반영이 늦고, `processing_job_id`, `processing_error`, `stt_status` 같은 운영 확인 정보도 충분히 드러나지 않았다.

## 무엇을 바꿨는가
- 프론트가 기존 `GET /api/v1/media/audio-extractions/:lectureId`를 함께 불러와 최신 추출 이력을 기준으로 상태를 그리게 했다.
- `MediaPipelinePage`에 자동 새로고침을 추가해 오디오 추출 또는 전사가 `PROCESSING`일 때 4초 간격으로 상태를 갱신하게 했다.
- 상태 보드에 `STT 상태`, `처리 서비스 job`, `처리 완료 시각`, `audio_url`, `요청 STT`를 노출하고, 갱신 중 배지를 추가했다.

## A/B 비교와 선택 이유
- A안: 기존 페이지와 상태 보드 안에서 조회 API 연결과 자동 새로고침만 보강하는 방식
- B안: 별도 상태 상세 패널과 전용 훅을 새로 분리하는 방식
- 이번에는 A안을 선택했다. 파일 수와 변경량이 적고, 이미 존재하는 API를 그대로 활용해 검증이 쉬웠다.

## 어떻게 검증했는가
- `npm run verify`
- 로컬 `wrangler dev`에서 `POST /api/v1/auth/login`, `POST /api/v1/media/extract-audio`, `GET /api/v1/media/audio-extractions/:lectureId`, `GET /api/v1/media/pipeline/:lectureId`를 호출해 완료/처리 중 상태 응답 형태를 확인했다.
