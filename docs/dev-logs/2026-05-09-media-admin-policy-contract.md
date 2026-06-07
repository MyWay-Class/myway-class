# 2026-05-09 Media Admin Policy Contract

## 요약
- 공개 테스트 정책 고정을 위해 media 관리 엔드포인트 권한 계약 테스트를 보강했다.

## 변경
- `MediaContractTest`에 역할 기반 접근 제어 검증 추가
  - 학생(`usr_std_001`)은 `/api/v1/media/extract-audio`, `/api/v1/media/upload-video`에서 `FORBIDDEN`
  - 강사(`usr_ins_001`)는 `/api/v1/media/extract-audio` 정상 생성(`201`)

## 기대 효과
- `upload-video`, `extract-audio`의 관리자(강사/운영자) 전용 정책이 회귀되지 않도록 CI에서 지속 검증한다.
