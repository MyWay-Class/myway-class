# media processor ffmpeg 서비스 추가

## 왜 바꿨는가
- callback 계약만 있는 상태로는 영상 업로드 후 실제 오디오 파일이 생기지 않았다.
- `#106`의 남은 핵심은 Workers 밖에서 돌아가는 실제 오디오 추출 엔진이었다.
- 실행 환경이 backend Worker와 다르기 때문에 독립 서비스로 분리하는 편이 구조상 더 맞았다.

## 무엇을 바꿨는가
- `scripts/media-processor/` 아래에 독립 Node 서비스 구현을 추가했다.
- `POST /jobs/audio-extraction`으로 job을 받고, 영상 다운로드 후 `ffmpeg`로 mono 16k WAV를 생성한다.
- 생성된 오디오는 `GET /assets/:jobId.wav`로 제공하고, backend callback으로 `audio_url`을 전달한다.
- `GET /health`, `GET /jobs`, `GET /jobs/:id`로 상태 확인이 가능하게 했다.
- 루트 `package.json`에 `npm run dev:media-processor`, `npm run check:media-processor`를 추가했다.
- 초기 `.mjs` 스크립트는 모두 `.ts`로 승격하고 `tsx` 런타임으로 직접 실행하게 바꿨다.

## A/B 비교와 선택 이유
- A안: `scripts/media-processor/`에 독립 실행형 서비스 추가
- B안: backend 내부에 개발 전용 처리 서버를 같이 두는 방식
- A안을 선택했다. 실행 환경이 달라 책임이 분명하고, backend/Workers 코드와 섞이지 않는다.

## 어떻게 검증했는가
- `npm run dev:media-processor`
- `npm run check:media-processor`
- 문서와 env 경로 점검
- 실제 ffmpeg 실행 검증은 로컬 실행 환경에 ffmpeg가 설치되어 있어야 한다.
