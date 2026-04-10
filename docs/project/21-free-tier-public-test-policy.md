# 무료 티어 공개 테스트 정책

## 목적
Cloudflare 무료 티어 안에서 MyWayClass의 AI, STT, 미디어 기능을 공개 테스트할 수 있도록 운영 경계와 우선순위를 정리한다.

## 배경
- 공개 테스트에서는 실제 사용자가 들어오므로, 기능이 돌아가는 것만큼 한도 초과를 막는 것이 중요하다.
- 긴 영상 실시간 처리와 업로드를 열어두면 무료 티어에서 금방 리스크가 커진다.
- 따라서 운영자 사전 처리와 일반 사용자 체험 범위를 분리해야 한다.

## 운영 모드
### dev
- 로컬 개발 전용
- Ollama 허용
- 미디어 업로드와 STT는 개발 편의성을 우선한다

### staging / production
- 공개 테스트 전용
- Ollama 비활성화
- Gemini는 텍스트 생성, Workers AI는 STT에 우선 사용
- AI/STT는 로그인 필수

## 공개 테스트 범위
- 허용
  - `summary`
  - `quiz`
  - `smart/chat`
  - 짧은 `media/transcribe`
- 제한
  - 긴 영상 업로드
  - 긴 영상 실시간 추출
  - 공개적인 오디오 추출 job 생성
- 비허용
  - 일반 사용자 대상 `upload-video`
  - 일반 사용자 대상 `extract-audio`

## 시간/길이 기준
- `media/transcribe`는 3분 이하만 허용한다.
- `20분~1시간` 영상은 운영자가 미리 업로드하고 미리 STT를 생성한다.
- 일반 사용자는 이미 준비된 transcript와 짧은 체험만 사용한다.

## quota 기준
- 사용자별 일일 quota를 둔다.
  - `smart`
  - `summary`
  - `quiz`
  - `answer`
  - `stt`
- 총량 quota를 추가로 둔다.
- Gemini 전역 quota를 별도 둔다.
- quota 초과 시 텍스트 AI는 `429` 또는 demo fallback, STT는 `429`를 우선한다.

## provider 기준
- `dev`: Ollama -> Gemini -> demo
- `staging / production`: Gemini -> demo
- `STT`: Cloudflare AI 우선, 실패 시 demo 또는 차단
- provider 상태는 `/api/v1/ai/providers`에서 확인한다.

## 운영 플로우
### 운영자
1. 긴 강의 영상을 미리 업로드한다.
2. 오디오 추출과 STT를 사전에 처리한다.
3. transcript, note, summary 후보를 준비한다.
4. 공개 테스트용 강의 샘플로 노출한다.

### 일반 사용자
1. 준비된 강의를 선택한다.
2. transcript 기반 검색, 요약, 퀴즈, 챗봇을 사용한다.
3. 짧은 STT만 제한적으로 사용한다.

## 관련 문서
- [AI 레이어](/C:/Users/ggg99/Desktop/내맘대로Class/myway-class/docs/project/14-ai-layer.md)
- [STT와 미디어 파이프라인](/C:/Users/ggg99/Desktop/내맘대로Class/myway-class/docs/project/07-stt-media-pipeline.md)
- [AI 비용 전략](/C:/Users/ggg99/Desktop/내맘대로Class/myway-class/docs/project/09-ai-cost-strategy.md)
- [배포 인프라](/C:/Users/ggg99/Desktop/내맘대로Class/myway-class/docs/project/19-deployment.md)

