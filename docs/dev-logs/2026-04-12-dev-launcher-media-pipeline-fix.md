# 2026-04-12 dev launcher와 media pipeline 실패 메시지 정리

## 왜 바꿨는지
- `npm run dev` 만으로는 media processor가 같이 뜨지 않아, 업로드 후 처리 상태판이 비어 보이기 쉬웠다.
- 업로드 실패 메시지가 backend 연결 실패와 R2/storage 실패를 구분하지 못해서, 실제 원인을 찾기 어려웠다.

## 무엇을 바꿨는지
- `scripts/dev.bat` 에서 frontend, backend와 함께 media processor도 같이 띄우도록 했다.
- `frontend/src/features/lms/pages/MediaPipelinePage.tsx` 에서 업로드 실패 메시지를 네트워크 실패와 저장소 실패로 나눠서 보여주도록 했다.

## 어떻게 검증했는지
- `npm run verify` 를 실행해 backend, frontend, media processor 타입 및 빌드 검사를 통과시켰다.

## 참고
- TS/TSX 소스는 그대로 유지하고, 실행 런처와 메시지만 정리한 변경이다.
