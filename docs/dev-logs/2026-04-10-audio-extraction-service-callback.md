# 오디오 추출 서비스 callback 연결

## 왜 바꿨는가
- `#106` 기준으로 영상 업로드 다음 단계인 실제 오디오 추출 서비스 연동이 필요했다.
- Workers 안에서 장시간 `ffmpeg`를 직접 돌리는 대신, 외부 media processor와 callback 계약을 먼저 붙이는 쪽이 현재 구조에 더 맞았다.
- `backend/src/routes/media.ts`가 300줄을 넘고 있어서 라우트 책임도 같이 정리해야 했다.

## 무엇을 바꿨는가
- `POST /api/v1/media/extract-audio`가 외부 media processor에 job을 dispatch하도록 연결했다.
- `POST /api/v1/media/extract-audio/callback`을 추가해 추출 완료/실패 상태를 다시 받게 했다.
- callback에서 `audio_url`이 오면 Cloudflare Workers AI STT를 자동으로 이어서 transcript를 만들게 했다.
- extraction 엔티티에 `processing_job_id`, `processing_error`, `processed_at`, 요청 언어/STT 정보 필드를 추가했다.
- asset URL은 요청 origin을 기준으로 만들게 바꿔서 프론트 origin과 섞이지 않게 했다.
- `media.ts` 응답 조립을 `backend/src/lib/media-response.ts`로 분리했다.

## A/B 비교와 선택 이유
- A안: 기존 `/media` API를 유지하고 `dispatch + callback`을 붙이는 방식
- B안: 전용 webhook 라우트와 상태 저장 레이어를 더 크게 분리하는 방식
- 이번에는 A안을 선택했다. 변경 파일 수가 적고, 현재 demo/shared 구조를 유지하면서 실제 처리 서비스와 연결하기 쉬웠다.

## 어떻게 검증했는가
- `npm run build:backend`
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`
