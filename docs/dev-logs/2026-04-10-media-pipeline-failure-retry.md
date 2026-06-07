# 미디어 파이프라인 실패 안내와 재시도 보강

## 왜 바꿨는가
- 처리 실패 시 `processing_error`만 노출되면 사용자가 다음에 무엇을 해야 할지 판단하기 어려웠다.
- 이미 업로드한 영상이나 직전 extraction 입력값이 남아 있을 때는 다시 업로드하지 않고도 재시도할 수 있는 동선이 필요했다.

## 무엇을 바꿨는가
- extraction 상태가 `FAILED`일 때 실패 안내 `StatePanel`을 추가했다.
- 최근 업로드 결과나 직전 extraction source를 재사용해 다시 추출을 요청하는 `추출 다시 시도` 버튼을 추가했다.
- 재시도 전에 확인할 운영 포인트를 화면에 함께 노출했다.
- 로컬 `wrangler dev` 검증 중 빠지던 `@cspotcode/source-map-support` 누락을 루트 dev dependency로 보강했다.

## A/B 비교와 선택 이유
- A안: 현재 페이지 안에서 실패 안내와 재시도 버튼을 보강하는 방식
- B안: 별도 장애 대응 패널과 상세 복구 흐름을 새로 분리하는 방식
- 이번에는 A안을 선택했다. 변경량이 적고, 사용자가 실패 직후 같은 화면에서 바로 다음 행동을 할 수 있었다.

## 어떻게 검증했는가
- `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`
- `npm run dev:frontend` 실행 후 Vite `ready` 로그 확인
- 로컬 `wrangler dev`에서 로그인 후 `extract-audio -> callback FAILED -> retry extract-audio -> audio-extractions/pipeline 조회` 순서로 응답 형태 확인
