# 실제 FFmpeg 실행 환경과 상태 상세화 A/B 비교

## 왜 바꿨는가
- `scripts/media-processor/`는 이미 FFmpeg로 오디오를 추출하고 있었지만, 운영자가 현재 실행 환경이 살아 있는지와 job이 어느 단계에서 멈췄는지를 한눈에 보기 어려웠다.
- callback secret, FFmpeg 가용성, 최근 job 진행 단계가 화면과 API에서 더 분명하게 드러나야 실제 운영 문제를 빠르게 잡을 수 있었다.

## A안
- backend와 media processor에 최소 헬스 체크만 추가했다.
- `GET /api/v1/media/processor-health`로 FFmpeg 가용성, 작업 디렉터리, job 카운트를 확인한다.
- 프론트는 기존 파이프라인 화면을 유지하고, 운영 상태는 응답 JSON 중심으로 확인하는 방향이다.

## B안
- A안의 헬스 체크에 더해 최근 job 요약, callback secret 설정 여부, FFmpeg 버전/출력, job 단계/세부 메시지를 함께 노출했다.
- 프론트 `MediaPipelinePage`와 `MediaPipelineStatusBoard`에 헬스 패널을 추가해 화면에서 바로 확인할 수 있게 했다.
- callback 실패, 추출 실패, 완료 시점을 job 상태로 더 자세히 남기도록 했다.

## 왜 B안을 선택했는가
- 이 이슈의 핵심은 단순히 FFmpeg가 실행되는지 여부가 아니라, "실행 환경이 실제로 준비됐는지"와 "지금 어디서 막혔는지"를 빠르게 보는 데 있다.
- B안은 백엔드 로그와 프론트 상태판이 같은 정보를 보여 줘서 운영 확인 비용이 낮다.
- callback secret, 최근 job 흐름, job stage를 같이 보여 주기 때문에 문제 원인을 좁히는 데 A안보다 유리하다.

## 어떻게 검증했는가
- A안: `npm run verify`
- B안: `npm run verify`
- 둘 다 `npm install` 후 검증을 통과했다.

