# 2026-04-13 Shortform FFmpeg Export A/B 비교

## 선택한 안
- B안

## A안 요약
- `ShortformVideo`에 export 상태 필드만 추가
- `MyShortformsPage`에서 status/result URL을 보여주는 최소 UI만 연결
- 실제 FFmpeg 처리와 callback 갱신은 없음

## B안 요약
- `scripts/media-processor`에 video trim + concat job을 추가
- `backend/src/routes/shortform.ts`에서 export job 발행, callback, retry를 연결
- `ShortformVideo`에 `export_status`, `export_result_url`, `export_retry_count`, `export_error_message`를 저장
- `MyShortformsPage`에서 export 상태, 결과 URL, 실패 사유, retry 버튼을 노출

## 선택 이유
- 이슈 요구사항이 “실제 영상 합치기”와 “결과 URL 저장/노출”, “retry”까지 포함하므로 B안이 요건을 온전히 만족한다.
- A안은 상태값은 남지만 사용자 입장에서 실제 산출물이 없어서, 문제를 미루는 구조에 가깝다.
- B안은 processor job, callback, UI 노출이 이어져서 이후 확장(부분 실패, 추가 재처리, 운영 진단)도 자연스럽다.
